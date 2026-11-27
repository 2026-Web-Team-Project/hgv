package org.webteam.hgucgv.reservation.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.webteam.hgucgv.performance.entity.PerformanceSession;
import org.webteam.hgucgv.user.entity.User;

@Entity
@Table(name = "reservations")
/*
SessionSeat에서는 어떤 공연에서 어떤 좌석이에 관한 내용이었다면
Reservation에서는 해당된 자석을 누가 예약했는지
 */
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 한 사용자가 여러 번 공연을 예매할 수 있기 때문
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "reservation")
    private List<ReservationSeat> reservationSeats = new ArrayList<>();

    // 특정 회차의 공연을 예약하기 때문에 PerformanceSession 참조
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private PerformanceSession performanceSession;

    // 나중에 공연 금액이 달라질 수도 있음 -> 이를 기억하고자 작성
    @Column(nullable = false)
    private int totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReservationStatus status;

    // 언제 예매했는지
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected Reservation() {
    }

    public Reservation(
            User user,
            PerformanceSession performanceSession,
            int totalAmount
    ) {
        this.user = user;
        this.performanceSession = performanceSession;
        this.totalAmount = totalAmount;
        this.status = ReservationStatus.PENDING_PAYMENT;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public PerformanceSession getPerformanceSession() {
        return performanceSession;
    }

    public int getTotalAmount() {
        return totalAmount;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void confirm() {
        this.status = ReservationStatus.CONFIRMED;
    }

    public void cancel() {
        this.status = ReservationStatus.CANCELLED;
    }

    public void expire() {
        this.status = ReservationStatus.EXPIRED;
    }

    public void failPayment() {
        this.status = ReservationStatus.PAYMENT_FAILED;
    }
}
