package org.webteam.hgucgv.entity;

import jakarta.persistence.*;
import org.webteam.hgucgv.performance.entity.PerformanceSession;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "session_seats",
    uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "seat_code"})
)
public class SessionSeat {
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

    private LocalDateTime holdExpiresAt;

    // 동시 수정 충돌 감지용. 실제 예약 서비스에서도 트랜잭션 처리가 필요함
    @Version
    private Long version;

    protected SessionSeat() {
    }

    public SessionSeat(PerformanceSession performanceSession, String seatCode) {
        this.performanceSession = performanceSession;
        this.seatCode = seatCode;
        this.status = SeatStatus.AVAILABLE;
    }

    public Long getId() { return id; }
    public PerformanceSession getPerformanceSession() { return performanceSession; }
    public String getSeatCode() { return seatCode; }
    public SeatStatus getStatus() { return status; }
    public LocalDateTime getHoldExpiresAt() { return holdExpiresAt; }
    public Long getVersion() { return version; }

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
