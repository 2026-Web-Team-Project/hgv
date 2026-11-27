package org.webteam.hgucgv.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.webteam.hgucgv.dto.PaymentConfirmRequest;
import org.webteam.hgucgv.dto.ReservationResponse;
import org.webteam.hgucgv.payment.entity.Payment;
import org.webteam.hgucgv.payment.entity.PaymentStatus;
import org.webteam.hgucgv.reservation.entity.Reservation;
import org.webteam.hgucgv.reservation.entity.ReservationSeat;
import org.webteam.hgucgv.reservation.entity.ReservationStatus;
import org.webteam.hgucgv.reservation.entity.SessionSeat;
import org.webteam.hgucgv.repository.PaymentRepository;
import org.webteam.hgucgv.repository.ReservationSeatRepository;
import org.webteam.hgucgv.toss.TossPaymentClient;
import org.webteam.hgucgv.toss.TossPaymentException;
import org.webteam.hgucgv.toss.TossPaymentResponse;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/*
 * 결제 비즈니스 로직을 담당하는 서비스.
 * 전체 흐름:
 *   1) 예약 생성 시 createReadyPayment() → Payment(READY) + orderId 발급
 *   2) 프론트가 orderId, 금액으로 Toss 결제창 띄움 → 사용자가 결제 인증
 *   3) Toss 가 successUrl 로 paymentKey, orderId, amount 전달
 *   4) 프론트가 POST /api/payments/confirm 호출 → confirm() 에서 검증 후 Toss 승인 API 호출
 *   5) 승인 성공이면 결제 DONE, 예약 CONFIRMED, 좌석 RESERVED 를 한 트랜잭션으로 저장
 */
@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ReservationSeatRepository reservationSeatRepository;
    private final TossPaymentClient tossPaymentClient;

    // 생성자 주입: 스프링이 필요한 Repository/Client 를 자동으로 넣어 준다.
    public PaymentService(PaymentRepository paymentRepository,
                          ReservationSeatRepository reservationSeatRepository,
                          TossPaymentClient tossPaymentClient) {
        this.paymentRepository = paymentRepository;
        this.reservationSeatRepository = reservationSeatRepository;
        this.tossPaymentClient = tossPaymentClient;
    }

    /*
     * 결제 준비
     * 예약 서비스 = ReservationService에서 예약을 저장한 직후 호출할 메서드.
     * orderId 는 Toss 규칙에 맞게 UUID 로 만든다.
     * 금액은 서버의 예약 금액을 그대로 복사 → 이후 프론트가 보낸 금액과 비교하는 기준
     */
    @Transactional
    public Payment createReadyPayment(Reservation reservation) {
        String orderId = "ORDER-" + UUID.randomUUID();
        Payment payment = new Payment(reservation, orderId, reservation.getTotalAmount());
        return paymentRepository.save(payment);
    }

    /*
     * 결제 승인.
     * @Transactional: 메서드 안의 DB 변경(결제·예약·좌석)이 전부 성공하거나 전부 취소된다.
     *   그래서 결제는 DONE 인데 좌석은 HELD 같은 어긋난 상태가 안 생긴다.
     * noRollbackFor: Toss 승인 실패 예외가 나도 롤백하지 않는다.
     *   → 실패 기록(FAILED, 좌석 반납)은 DB 에 남겨야 하니까 추가함
     */
    @Transactional(noRollbackFor = TossPaymentException.class)
    public ReservationResponse confirm(PaymentConfirmRequest request) {
        // orderId 로 결제 조회. 락이 걸려 있어서 같은 주문의 동시 요청은 순서대로 처리된다.
        Payment payment = paymentRepository.findByOrderId(request.orderId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 주문입니다: " + request.orderId()));

        //멱등성 처리: 이미 승인된 주문이면 Toss 를 다시 부르지 않고 기존 결과를 돌려준다.

        if (payment.getStatus() == PaymentStatus.DONE) {
            if (payment.getPaymentKey().equals(request.paymentKey())) {
                return ReservationResponse.from(payment);
            }
            throw new IllegalStateException("이미 다른 결제로 승인된 주문입니다.");
        }
        if (payment.getStatus() != PaymentStatus.READY) {
            throw new IllegalStateException("승인할 수 없는 결제 상태입니다: " + payment.getStatus());
        }

        // (3) 금액 검증: 프론트 값은 사용자가 조작할 수 있으므로 반드시 DB 금액과 비교한다.
        //       (예: 30,000원 좌석을 100원으로 바꿔서 결제하는 공격 방지)
        Reservation reservation = payment.getReservation();
        if (request.amount() != payment.getAmount() || request.amount() != reservation.getTotalAmount()) {
            throw new IllegalArgumentException("결제 금액이 예약 금액과 다릅니다.");
        }

        // 예약 상태 검증 =  결제 대기 중인 예약만 승인 가능
        if (reservation.getStatus() != ReservationStatus.PENDING_PAYMENT) {
            throw new IllegalStateException("결제 대기 중인 예약이 아닙니다: " + reservation.getStatus());
        }

        //  좌석 임시 확보 시간이 지났는지 확인. 이미 만료됐으면 Toss 승인 자체를 하지 않는다.
        //       (만료된 좌석은 다른 사람이 잡았을 수 있으니까 돈을 받으면 안 됨)
        List<SessionSeat> seats = findSeats(reservation);
        LocalDateTime now = LocalDateTime.now();
        for (SessionSeat seat : seats) {
            if (seat.getHoldExpiresAt() != null && seat.getHoldExpiresAt().isBefore(now)) {
                throw new IllegalStateException("좌석 선점 시간이 만료되었습니다: " + seat.getSeatCode());
            }
        }

        //검증을 다 통과한 뒤에야 Toss 승인 API 호출 → 이 시점에 실제 결제가 일어난다.
        TossPaymentResponse toss;
        try {
            toss = tossPaymentClient.confirm(request.paymentKey(), request.orderId(), request.amount());
        } catch (TossPaymentException e) {
            //승인 실패(카드 거절  , 잔액부족): 결제 FAILED, 예약 PAYMENT_FAILED, 좌석은 다시 AVAILABLE 로 반납
            payment.markFailed();
            reservation.failPayment();
            seats.forEach(SessionSeat::release);
            throw e;
        }

        //  승인 성공: 결제 정보 저장 + 예약 확정 + 좌석 확정.
        //       JPA 변경 감지(dirty checking) 덕분에 save() 를 따로 안 불러도 트랜잭션 끝날 때 UPDATE 된다.
        payment.markDone(toss.paymentKey(), parseApprovedAt(toss.approvedAt()));
        reservation.confirm();
        seats.forEach(SessionSeat::confirm); // HELD → RESERVED

        return ReservationResponse.from(payment);
    }

    /*
     *  결제 취소 , 환불
     * 승인 때 저장해 둔 paymentKey 로 Toss 취소 API 를 호출하고,
     * 성공하면 결제 CANCELED, 예약 CANCELLED, 좌석 AVAILABLE 로 되돌린다.
     *
     */
    @Transactional
    public ReservationResponse cancel(String orderId, String cancelReason) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 주문입니다: " + orderId));

        // 멱등성: 이미 취소된 결제면 다시 환불하지 않고 현재 상태만 돌려준다.
        if (payment.getStatus() == PaymentStatus.CANCELED) {
            return ReservationResponse.from(payment);
        }
        //  승인 완료(DONE)된 결제만 환불 가능 (READY 는 돈이 안 나갔으니 환불할 게 없음)
        if (payment.getStatus() != PaymentStatus.DONE) {
            throw new IllegalStateException("승인 완료된 결제만 취소할 수 있습니다: " + payment.getStatus());
        }

        //  Toss 취소 API 먼저 호출. 실패하면 예외가 나서 아래 DB 변경은 실행되지 않는다.
        String reason = (cancelReason == null || cancelReason.isBlank()) ? "사용자 예매 취소" : cancelReason;
        tossPaymentClient.cancel(payment.getPaymentKey(), payment.getOrderId(), reason);

        Reservation reservation = payment.getReservation();
        payment.markCanceled();
        reservation.cancel();
        findSeats(reservation).forEach(SessionSeat::release);

        return ReservationResponse.from(payment);
    }

    // 예약에 묶인 좌석(SessionSeat) 목록 조회: ReservationSeat 연결 테이블을 거쳐서 꺼낸다.
    private List<SessionSeat> findSeats(Reservation reservation) {
        return reservationSeatRepository.findByReservationId(reservation.getId()).stream()
                .map(ReservationSeat::getSessionSeat)
                .toList();
    }

    // Toss 의 approvedAt 엔티티 타입으로 변환
    private LocalDateTime parseApprovedAt(String approvedAt) {
        if (approvedAt == null) {
            return LocalDateTime.now();
        }
        return OffsetDateTime.parse(approvedAt).toLocalDateTime();
    }
}
