package org.webteam.hgucgv.performance.entity;

import jakarta.persistence.*;
import org.webteam.hgucgv.reservation.entity.SessionSeat;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "performance_sessions",
        uniqueConstraints = {@UniqueConstraint(
                columnNames = {"performance_id", "start_at"}
                /*같은 시간 기준으로 중복 공연 등록을 막음*/
        ), @UniqueConstraint(
                columnNames = {"performance_id", "sessionNo"}
                /*공연 회차 기준으로 중복 공연 등록을 막음*/
        )}
)
// 세부 공연에 관한 정보 1공, 2공,,,,
public class PerformanceSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "performance_id", nullable = false)
    private Performance performance;

    @OneToMany(mappedBy = "performanceSession")
    private List<SessionSeat> seats = new ArrayList<>();

    // 해당 날짜의 1공, 2공, 3공, 4공
    @Column(nullable = false)
    private int sessionNo;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SessionStatus status;

    protected PerformanceSession() {
    }

    public PerformanceSession(
            Performance performance,
            int sessionNo,
            LocalDateTime startAt
    ) {
        this.performance = performance;
        this.sessionNo = sessionNo;
        this.startAt = startAt;
        this.status = SessionStatus.OPEN;
    }

    public Long getId() {
        return id;
    }

    public Performance getPerformance() {
        return performance;
    }

    public int getSessionNo() {
        return sessionNo;
    }

    public LocalDateTime getStartAt() {
        return startAt;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public void updateSchedule(
            int sessionNo,
            LocalDateTime startAt
    ) {
        this.sessionNo = sessionNo;
        this.startAt = startAt;
    }

    public void changeStatus(SessionStatus status) {
        this.status = status;
    }
}