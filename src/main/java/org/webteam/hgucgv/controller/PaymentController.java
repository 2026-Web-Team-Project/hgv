package org.webteam.hgucgv.controller;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.webteam.hgucgv.dto.PaymentConfirmRequest;
import org.webteam.hgucgv.dto.ReservationResponse;
import org.webteam.hgucgv.service.PaymentService;

/*
 * [리뷰] 결제 REST API 컨트롤러.
 * @RestController: 반환값을 HTML 화면이 아니라 JSON 으로 응답한다.
 * 컨트롤러는 요청 받기 + 서비스 호출만 하고, 실제 로직은 PaymentService 에 둔다.
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /*
     *  결제 승인은  POST /api/payments/confirm
     * body: { "paymentKey": "...", "orderId": "...", "amount": 15000 }
     * @Valid: DTO 의 @NotBlank, @Positive 검사를 먼저 수행 → 값이 비면 400 응답
     */
    @PostMapping("/confirm")
    public ReservationResponse confirm(@Valid @RequestBody PaymentConfirmRequest request) {
        return paymentService.confirm(request);
    }

    /*
     * 결제 취소 , 환불
     * 취소 사유는 선택값이라 별도 DTO 없이 @RequestParam 으로 받는다.
     */
    @PostMapping("/{orderId}/cancel")
    public ReservationResponse cancel(@PathVariable String orderId,
                                      @RequestParam(required = false) String reason) {
        return paymentService.cancel(orderId, reason);
    }
}
