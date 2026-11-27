package org.webteam.hgucgv.reservation.entity;

import jakarta.persistence.*;
import org.webteam.hgucgv.performance.entity.PerformanceSession;

import java.time.LocalDateTime;

@Entity
//해당 공연에 좌석 중복 예약을 막음
@Table(name = "session_seats", uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "seat_code"}))

// 몇공에 대한 좌석이기 때문에 performanceSession과 연결된다.
/*
특정 공연의 좌석에 관한 엔티티로 각 회차별 좌석의 상태를 담당하는 엔티티다. - 특정 좌석 1개
 */ public class SessionSeat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private PerformanceSession performanceSession;

    @Column(name = "seat_code", nullable = false, length = 20)
    private String seatCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SeatStatus status;

    // 임시 확보 만료 시각
    @Column(name = "hold_expires_at")
    private LocalDateTime holdExpiresAt;

    /*
    JPA에서 낙관적 락(Optimistic Locking)을 구현하기 위한 어노테이션
    동시 예약 충돌 방지
    a, b가 동시에 같은 좌석 예매를 원할 때 a 가 먼저 좌석을 예매했을 경우 version을 변경시키고 @Version이 version은 차이를 감지하여 b의 수정을 막는다.
     */
    @Version
    private Long version;

    protected SessionSeat() {
    }

    public SessionSeat(PerformanceSession performanceSession, String seatCode) {
        this.performanceSession = performanceSession;
        this.seatCode = seatCode;
        this.status = SeatStatus.AVAILABLE;
    }

    public Long getId() {
        return id;
    }

    public PerformanceSession getPerformanceSession() {
        return performanceSession;
    }

    public String getSeatCode() {
        return seatCode;
    }

    public SeatStatus getStatus() {
        return status;
    }

    public LocalDateTime getHoldExpiresAt() {
        return holdExpiresAt;
    }

    public Long getVersion() {
        return version;
    }

    public void holdUntil(LocalDateTime expiresAt) {
        if (this.status != SeatStatus.AVAILABLE) {
            throw new IllegalStateException("예약 가능한 좌석이 아닙니다.");
        }
        this.status = SeatStatus.HELD;
        this.holdExpiresAt = expiresAt;
    }

    public void confirm() {
        if (this.status != SeatStatus.HELD) {
            throw new IllegalStateException("임시 확보된 좌석만 확정할 수 있습니다.");
        }
        this.status = SeatStatus.RESERVED;
        this.holdExpiresAt = null;
    }

    public void release() {
        if (this.status != SeatStatus.HELD && this.status != SeatStatus.RESERVED) {
            throw new IllegalStateException("확보 또는 예약된 좌석만 해제할 수 있습니다.");
        }
        this.status = SeatStatus.AVAILABLE;
        this.holdExpiresAt = null;
    }

    public void block() {
        if (this.status != SeatStatus.AVAILABLE) {
            throw new IllegalStateException("빈 좌석만 차단할 수 있습니다.");
        }
        this.status = SeatStatus.BLOCKED;
    }

    public void unblock() {
        if (this.status != SeatStatus.BLOCKED) {
            throw new IllegalStateException("차단 좌석이 아닙니다.");
        }
        this.status = SeatStatus.AVAILABLE;
    }
}