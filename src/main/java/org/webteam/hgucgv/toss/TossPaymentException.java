package org.webteam.hgucgv.toss;

/*
 * Toss API 가 실패 응답을 줬을 때 던지는 예외.
 * Toss 에러 응답은 { "code": "...", "message": "..." } 형태라서 두 값을 그대로 담아 둔다.
 * (예: code = REJECT_CARD_PAYMENT, message = 한도초과 혹은 잔액부족으로 결제에 실패했습니다.)
 */
public class TossPaymentException extends RuntimeException {

    private final String code;

    public TossPaymentException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
