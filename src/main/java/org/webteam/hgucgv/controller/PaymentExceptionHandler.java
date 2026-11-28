package org.webteam.hgucgv.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.webteam.hgucgv.toss.TossPaymentException;

import java.util.Map;

/*
 * 결제 API 에서 난 예외를 JSON 에러 응답으로 바꿔 주는 클래스.
 * assignableTypes 로 PaymentController 에만 적용 → 팀원 컨트롤러에는 영향 없음.
 * 프론트는 응답의 code/message 를 보고 "카드 한도 초과" 같은 안내를 띄우면 된다.
 */
@RestControllerAdvice(assignableTypes = PaymentController.class)
public class PaymentExceptionHandler {

    // Toss 가 승인/취소를 거절한 경우 → 400 + Toss 에러 코드 그대로 전달
    @ExceptionHandler(TossPaymentException.class)
    public ResponseEntity<Map<String, String>> handleToss(TossPaymentException e) {
        return ResponseEntity.badRequest()
                .body(Map.of("code", e.getCode(), "message", e.getMessage()));
    }

    //  없는 주문, 금액 불일치 같은 잘못된 요청 → 400
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
        return ResponseEntity.badRequest()
                .body(Map.of("code", "INVALID_REQUEST", "message", e.getMessage()));
    }

    //이미 처리된 결제, 좌석 만료 등 현재 상태와 충돌 → 409 Conflict
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleConflict(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("code", "INVALID_STATE", "message", e.getMessage()));
    }
}
