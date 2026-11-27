package org.webteam.hgucgv.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import org.webteam.hgucgv.performance.entity.PerformanceSession;
import org.webteam.hgucgv.user.entity.User;

@Entity
@Table(name = "reservations")
public class Reservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private PerformanceSession performanceSession;

    @Column(nullable = false)
    private int totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReservationStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected Reservation() {
    }

    public Reservation(User user, PerformanceSession performanceSession,
                       int totalAmount) {
        this.user = user;
        this.performanceSession = performanceSession;
        this.totalAmount = totalAmount;
        this.status = ReservationStatus.PENDING_PAYMENT;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public PerformanceSession getPerformanceSession() { return performanceSession; }
    public int getTotalAmount() { return totalAmount; }
    public ReservationStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void confirm() { this.status = ReservationStatus.CONFIRMED; }
    public void cancel() { this.status = ReservationStatus.CANCELLED; }
    public void expire() { this.status = ReservationStatus.EXPIRED; }
    public void failPayment() { this.status = ReservationStatus.PAYMENT_FAILED; }
}
