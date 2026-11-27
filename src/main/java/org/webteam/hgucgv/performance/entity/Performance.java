package org.webteam.hgucgv.performance.entity;

import jakarta.persistence.*;
import org.webteam.hgucgv.Attachment.entity.Attachment;
import org.webteam.hgucgv.club.entity.Club;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "performances")
/*
공연 회차와는 다른 entity
공연 전반적인 내용을 다루고 각 공연 회차는 PerformanceSession으로 정한다.
 */
public class Performance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @OneToMany(mappedBy = "performance")
    private List<PerformanceSession> sessions = new ArrayList<>();

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 3000)
    private String description;

    @Column(nullable = false)
    private int price;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poster_attachment_id", unique = true)
    private Attachment poster;

    @Enumerated(EnumType.STRING)
    // Enum의 이름을 문자열로 저장하도록 지정하는 어노테이션
    @Column(nullable = false, length = 30)
    private VenueType venue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PerformanceStatus status;

    protected Performance() {
    }

    public Performance(
            Club club,
            String title,
            String description,
            int price,
            VenueType venue
    ) {
        this.club = club;
        this.title = title;
        this.description = description;
        this.price = price;
        this.venue = venue;
        this.status = PerformanceStatus.DRAFT;
    }

    public Long getId() { return id; }
    public Club getClub() { return club; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public int getPrice() { return price; }
    public VenueType getVenue() { return venue; }
    public PerformanceStatus getStatus() { return status; }

    public void update(String title, String description, int price,
                       String posterPath, VenueType venue) {
        this.title = title;
        this.description = description;
        this.price = price;
        this.venue = venue;
    }

    public void changeStatus(PerformanceStatus status) {
        this.status = status;
    }
}