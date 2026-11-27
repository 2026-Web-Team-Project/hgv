package org.webteam.hgucgv.user.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
    Google 계정의 고유 식별자
    Google 사용자와 프로젝트 유저 연결
    Google이 해당 계정에 부여한 고유 식별자로 108234567890123456789 와 같다.
     */
    @Column(nullable = false, unique = true, length = 150)
    private String googleSub;

    /*
    학교 이메일 - 학교 구성원 접근 조건 확인 및 표시
     */
    @Column(nullable = false, unique = true, length = 150)
    private String schoolEmail;
    /*
    흐름
    1. 구글로 로그인
    2. Google이 사용자 식별자 108234567890123456789를 전달
    3. 존재한다면 기존 User 조회
    4. 존재하지 않는다면 새 User 생성
     */

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected User() {
    }

    public User(String googleSub, String schoolEmail, String name) {
        this.googleSub = googleSub;
        this.schoolEmail = schoolEmail;
        this.name = name;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getGoogleSub() { return googleSub; }
    public String getSchoolEmail() { return schoolEmail; }
    public String getName() { return name; }
    public LocalDateTime getCreatedAt() { return createdAt; }

}