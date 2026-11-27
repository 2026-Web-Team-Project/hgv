package org.webteam.hgucgv.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.webteam.hgucgv.entity.ReservationSeat;

import java.util.List;

/*
 * 예약-좌석 연결 테이블 Repository.
 * 결제 승인/취소 시 예약에 묶인 좌석들을 찾아서 상태를 바꾸려고 사용.
 */
public interface ReservationSeatRepository extends JpaRepository<ReservationSeat, Long> {

    // 메서드 이름  reservation.id 로 조회 → WHERE reservation_id = ?
    List<ReservationSeat> findByReservationId(Long reservationId);
}
