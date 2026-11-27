package org.webteam.hgucgv.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/*
 *  결제 승인 요청 DTO.
 * 사용자가 Toss 결제창에서 결제를 마치면 Toss가 successUrl 로
 * paymentKey, orderId, amount 3개를 붙여서 돌려보낸다.
 * 프론트는 이 3개를 그대로 POST /api/payments/confirm 으로 보낸다.
 *
 */
public record PaymentConfirmRequest(
        @NotBlank String paymentKey, // Toss가 발급한 결제 키
        @NotBlank String orderId,
        @Positive int amount
) {
}
