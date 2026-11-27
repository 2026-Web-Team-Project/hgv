package org.webteam.hgucgv.toss;

/*
 * Toss 승인/취소 API 응답(Payment 객체) 중에서 우리가 쓰는 필드만 받는 DTO.
 * Toss 응답에는 필드가 훨씬 많지만, 모르는 필드는 무시되고 아래 필드만 채워진다.
 * - status     : 승인 성공이면 "DONE", 전체 취소면 "CANCELED"
 * - approvedAt : 승인 시각, ISO 8601 문자열 (예: 2022-01-01T00:00:00+09:00)
 * - totalAmount: 실제 결제된 금액
 */
public record TossPaymentResponse(
        String paymentKey,
        String orderId,
        String status,
        String approvedAt,
        int totalAmount
) {
}
