package org.webteam.hgucgv.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.webteam.hgucgv.entity.Payment;

import java.util.Optional;

/*
 * Payment 테이블 접근용 Repository.
 * JpaRepository 를 상속하면 save, findById 같은 기본 CRUD 를 자동으로 쓸 수 있다.
 */
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    /*
     * orderId 로 결제 조회
     * 같은 orderId 로 승인 요청이 동시에 두 번 들어오면 (새로고침, 버튼 연타)
     * 두 번째 요청은 첫 번째 트랜잭션이 끝날 때까지 기다린다.
     * → 첫 요청이 DONE 으로 바꾼 뒤에 두 번째 요청이 읽으니까 중복 승인이 안 된다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Payment> findByOrderId(String orderId);
}
