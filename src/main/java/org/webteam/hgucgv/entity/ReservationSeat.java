package org.webteam.hgucgv.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "reservation_seats",
    uniqueConstraints = @UniqueConstraint(columnNames = {"reservation_id", "session_seat_id"})
)
public class ReservationSeat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_seat_id", nullable = false)
    private SessionSeat sessionSeat;

    @Column(nullable = false, length = 20)
    private String seatCodeSnapshot;

    protected ReservationSeat() {
    }

    public ReservationSeat(Reservation reservation, SessionSeat sessionSeat) {
        this.reservation = reservation;
        this.sessionSeat = sessionSeat;
        this.seatCodeSnapshot = sessionSeat.getSeatCode();
    }

    public Long getId() { return id; }
    public Reservation getReservation() { return reservation; }
    public SessionSeat getSessionSeat() { return sessionSeat; }
    public String getSeatCodeSnapshot() { return seatCodeSnapshot; }
}
