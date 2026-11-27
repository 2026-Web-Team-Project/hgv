package org.webteam.hgucgv.user.entity;

import jakarta.persistence.*;
import org.webteam.hgucgv.club.entity.Club;

@Entity
/*
uniqueConstraints: 두 컬럼의 조합이 중복되지 않도록 제한
같은 사용자가 같은 동아리의 관리자로 두 번 등록되는 상황을 방지
즉
userid 1 과 clubid 1 과 연결되었다면 중ㅇ 다시 똑같은 조합으로 못 만든다는 말
(userid,clubid)가 (1,1), (1,2), (2,1) 이렇게 존재 했을 때 (1,1)이 다시 만들어지진 못함
 */
@Table(
    name = "club_admins",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "club_id"})
)
public class ClubAdmin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
    Long userId 를 하더라도 사용자 ID 자체를 저장가능 하지만
    객체로 저장함으로서 User를 객체 형태로 참조 가능하다.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    // 외래키(FK)가 저장될 컬럼을 지정하는 어노테이션 -> ClubAdmin에는 User가 저장되는 것이 아닌 User의 PK가 저장된다.
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /*
    User와 마찬가지로 진행된다.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    protected ClubAdmin() {
    }

    public ClubAdmin(User user, Club club) {
        this.user = user;
        this.club = club;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public Club getClub() { return club; }

}
