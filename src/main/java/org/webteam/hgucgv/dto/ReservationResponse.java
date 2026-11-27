package org.webteam.hgucgv.dto;

import org.webteam.hgucgv.payment.entity.Payment;
import org.webteam.hgucgv.reservation.entity.ReservationStatus;

/*
 * 예약/결제 결과 응답 DTO
 * 엔티티를 그대로 JSON으로 내보내면 지연 로딩·순환 참조 문제가 생기니까 필요한 값만 담는다.
 */
public record ReservationResponse(
        Long reservationId,
        String orderId,
        int amount,
        ReservationStatus status
) {
    //Payment 하나로 예약 정보까지 꺼내서 응답을 만드는 편의 메서드
    public static ReservationResponse from(Payment payment) {
        return new ReservationResponse(
                payment.getReservation().getId(),
                payment.getOrderId(),
                payment.getAmount(),
                payment.getReservation().getStatus()
        );
    }
}
