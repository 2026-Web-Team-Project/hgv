package org.webteam.hgucgv.payment.entity;

import jakarta.persistence.*;
import org.webteam.hgucgv.reservation.entity.Reservation;

import java.time.LocalDateTime;

/*
 *  결제 1건 = Payment 1행.
 * 예약(Reservation)이 만들어질 때 READY 상태로 같이 생성되고,
 * Toss 승인 성공 시 DONE, 실패 시 FAILED, 환불 시 CANCELED 로 바뀐다.
 */

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //  어떤 예약에 대한 결제인지. 결제 승인 시 이 예약과 좌석 상태를 같이 바꾼다.
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    // 우리 서버가 만든 주문번호. Toss 결제창에 넘기고, 승인 요청 때 다시 받아서 결제를 찾는 키로 쓴다.
    @Column(nullable = false, unique = true, length = 100)
    private String orderId;

    //Toss가 발급한 결제 키. 승인 후에 저장해 두어야 나중에 취소 API를 호출할 수 있다.
    @Column(unique = true, length = 200)
    private String paymentKey;

    // 결제해야 할 금액. 프론트가 보낸 금액과 비교해서 금액 조작을 막는 기준값.
    @Column(nullable = false)
    private int amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime approvedAt;

    // JPA가 DB에서 객체를 만들 때 쓰는 기본 생성자
    protected Payment() {
    }

    // 예약 생성 시 호출: 아직 결제 전이라 상태는 READY
    public Payment(Reservation reservation, String orderId, int amount) {
        this.reservation = reservation;
        this.orderId = orderId;
        this.amount = amount;
        this.status = PaymentStatus.READY;
    }

    // 저장 직전에 생성 시각을 자동으로 채운다.
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Reservation getReservation() { return reservation; }
    public String getOrderId() { return orderId; }
    public String getPaymentKey() { return paymentKey; }
    public int getAmount() { return amount; }
    public PaymentStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getApprovedAt() { return approvedAt; }

    //  Toss 승인 성공: 결제 키와 승인 시각을 저장하고 DONE 처리
    public void markDone(String paymentKey, LocalDateTime approvedAt) {
        this.paymentKey = paymentKey;
        this.approvedAt = approvedAt;
        this.status = PaymentStatus.DONE;
    }

    // Toss 승인 실패
    public void markFailed() {
        this.status = PaymentStatus.FAILED;
    }

    //  Toss 취소환불 성공
    public void markCanceled() {
        this.status = PaymentStatus.CANCELED;
    }

    protected Payment() {
    }

    public Payment(
            Reservation reservation,
            String orderId,
            int amount
    ) {
        this.reservation = reservation;
        this.orderId = orderId;
        this.amount = amount;
        this.status = PaymentStatus.READY;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
