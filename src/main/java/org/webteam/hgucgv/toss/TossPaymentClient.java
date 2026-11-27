package org.webteam.hgucgv.toss;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/*
 * Toss Payments 서버와 HTTP 통신만 담당하는 클래스.
 * 서비스(PaymentService)는 "승인해 줘 / 취소해 줘"만 부르고,
 * 인증 헤더 만들기·URL·에러 변환 같은 세부 사항은 여기에 모아 둔다.
 */
@Component
public class TossPaymentClient {

    private static final String BASE_URL = "https://api.tosspayments.com/v1/payments";

    private final RestClient restClient;

    /*
     * [리뷰] 시크릿 키는 코드에 직접 쓰지 않고 application.properties → 환경변수 TOSS_SECRET_KEY 에서 받는다.
     * GitHub 에 키가 올라가면 안 되기 때문
     * Toss 인증 방식 = Basic 인증.
     * 시크릿키: 를 Base64 로 인코딩해서 Authorization: Basic xxx 헤더에 넣는다.
     */
    public TossPaymentClient(@Value("${toss.secret-key}") String secretKey) {
        String encoded = Base64.getEncoder()
                .encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));

        this.restClient = RestClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + encoded)
                .build();
    }

    /*
     *  결제 승인 API: POST /v1/payments/confirm
     * 사용자가 결제창에서 인증만 끝낸 상태라 아직 돈이 빠져나가지 않았다.
     * 이 API 를 호출해야 실제로 결제가 확정된다. + 결제 인증 후 10분 안에 호출해야 함
     */
    public TossPaymentResponse confirm(String paymentKey, String orderId, int amount) {
        try {
            return restClient.post()
                    .uri("/confirm")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of(
                            "paymentKey", paymentKey,
                            "orderId", orderId,
                            "amount", amount))
                    .retrieve()
                    .body(TossPaymentResponse.class);
        } catch (RestClientResponseException e) {
            // 4xx/5xx 응답이면 Toss 에러 코드/메시지를 꺼내서 우리 예외로 바꿔 던진다.
            throw toTossException(e);
        }
    }

    /*
     *  결제 취소 API: POST /v1/payments/{paymentKey}/cancel
     * cancelReason 은 필수, cancelAmount 를 안 보내면 전액 취소.
     * Idempotency-Key 헤더: 같은 키로 다시 요청하면 Toss 가 두 번 취소하지 않고 첫 응답을 돌려준다.
     * → 네트워크 오류로 재시도해도 중복 환불이 안 되게 orderId 기반 키를 쓴다.
     */
    public TossPaymentResponse cancel(String paymentKey, String orderId, String cancelReason) {
        try {
            return restClient.post()
                    .uri("/{paymentKey}/cancel", paymentKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Idempotency-Key", "cancel-" + orderId)
                    .body(Map.of("cancelReason", cancelReason))
                    .retrieve()
                    .body(TossPaymentResponse.class);
        } catch (RestClientResponseException e) {
            throw toTossException(e);
        }
    }

    //  Toss 에러 응답 형태: { "code": "...", "message": "..." }
    private record TossErrorResponse(String code, String message) {
    }

    private TossPaymentException toTossException(RestClientResponseException e) {
        try {
            TossErrorResponse error = e.getResponseBodyAs(TossErrorResponse.class);
            if (error != null && error.code() != null) {
                return new TossPaymentException(error.code(), error.message());
            }
        } catch (RuntimeException ignored) {
            // 응답 본문이 JSON 이 아니면 아래 기본 메시지 사용
        }
        return new TossPaymentException("TOSS_ERROR", "Toss 결제 서버 오류: " + e.getStatusCode());
    }
}
