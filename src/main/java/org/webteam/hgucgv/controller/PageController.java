package org.webteam.hgucgv.controller;
// 본인의 실제 package 이름으로 변경

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    // 메인 화면
    @GetMapping({"/", "/index.html"})
    public String home() {
        return "index";
    }

    // 공연 상세
    @GetMapping("/performance.html")
    public String performance() {
        return "performance";
    }

    // 좌석 선택
    @GetMapping("/seats.html")
    public String seats() {
        return "seats";
    }

    // 로그인 및 회원가입 진입
    @GetMapping("/login.html")
    public String login() {
        return "login";
    }

    // 마이페이지
    @GetMapping("/mypage.html")
    public String mypage() {
        return "mypage";
    }

    // 관리자 페이지
    @GetMapping("/admin.html")
    public String admin() {
        return "admin";
    }
}