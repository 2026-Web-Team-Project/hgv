package org.webteam.hgucgv.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping("/")
    public String home() {
        return "index";
    }

    @GetMapping("/performances/{id}")
    public String performance() {
        return "performance";
    }

    @GetMapping("/seats")
    public String seats() {
        return "seats";
    }

    @GetMapping("/mypage")
    public String mypage() {
        return "mypage";
    }
}
