package org.webteam.hgucgv.user.entity;

import jakarta.persistence.*;
import org.webteam.hgucgv.club.entity.Club;

@Entity
@Table(
    name = "club_admins",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "club_id"})
)
public class ClubAdmin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

}
