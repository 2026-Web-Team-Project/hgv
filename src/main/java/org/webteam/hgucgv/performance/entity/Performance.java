package org.webteam.hgucgv.performance.entity;

import jakarta.persistence.*;
import org.webteam.hgucgv.club.entity.Club;

@Entity
@Table(name = "performances")
public class Performance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 3000)
    private String description;

    @Column(nullable = false)
    private int price;

    @Column(length = 500)
    private String posterPath;

    @Column(nullable = false, length = 100)
    private String venue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PerformanceStatus status;

    protected Performance() {
    }

    public Performance(Club club, String title, String description,
                       int price, String posterPath, String venue) {
        this.club = club;
        this.title = title;
        this.description = description;
        this.price = price;
        this.posterPath = posterPath;
        this.venue = venue;
        this.status = PerformanceStatus.DRAFT;
    }

    public Long getId() { return id; }
    public Club getClub() { return club; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public int getPrice() { return price; }
    public String getPosterPath() { return posterPath; }
    public String getVenue() { return venue; }
    public PerformanceStatus getStatus() { return status; }

    public void update(String title, String description, int price,
                       String posterPath, String venue) {
        this.title = title;
        this.description = description;
        this.price = price;
        this.posterPath = posterPath;
        this.venue = venue;
    }

    public void changeStatus(PerformanceStatus status) {
        this.status = status;
    }
}