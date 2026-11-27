package org.webteam.hgucgv.reservation.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "reservation_seats",
    uniqueConstraints = @UniqueConstraint(columnNames = {"reservation_id", "session_seat_id"})
)

/*
a가 a1과 a2를 예약함 하지만 어디를 예약했는지는 reservation에 저장되어 있지 않음
그리고 SessionSeat에서는 누가 예약했는지를 모른다.
-> 이 둘을 연결시켜주는 역할

Reservation: 누가 얼마를 내고 어떤 회차의 공연을 연결하였는가 - 1개의 예약

SessionSeat: 특정 공연 회차의 "한" 좌석 정보와 현재 상태(예매 가능, 예약 중, 예약 완료 등)를 관리

ReservationSeat: 위 둘을 연결 그렇다면 하나는 좌석 하나와 예매 하나를 연결하는 기록

즉 1명이 한 예약으로 3자리를 예약 - > 1개의 Reservation / 3개의 ReservationSeat 연결 /  3개의 SessionSeat
 */
public class ReservationSeat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 누군가 예매를 취소하고 다른 사람이 재 예애를 했을 수도 있기 때문에
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    /*
    하나의 시트가 시간에 따라 여러 ReservationSeat 기록에서 참조될 수 있기 때문에 @ManyToOne
    누군가 취소하고 재예매를 할 수 있기 때문에
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_seat_id", nullable = false)
    private SessionSeat sessionSeat;

    // 예매 당시의 좌석 번호를 기록으로 남기기 위해서 = 과거 예매자가 당시 A1을 예약했다는 사실을 유지
    @Column(nullable = false, length = 20)
    private String seatCodeSnapshot;

    protected ReservationSeat() {
    }

    public ReservationSeat(
            Reservation reservation,
            SessionSeat sessionSeat
    ) {
        this.reservation = reservation;
        this.sessionSeat = sessionSeat;
        this.seatCodeSnapshot = sessionSeat.getSeatCode();
    }

    public Long getId() {
        return id;
    }

    public Reservation getReservation() {
        return reservation;
    }

    public SessionSeat getSessionSeat() {
        return sessionSeat;
    }

    public String getSeatCodeSnapshot() {
        return seatCodeSnapshot;
    }
}