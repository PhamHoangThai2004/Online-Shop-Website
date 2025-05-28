package com.group_2.onlineshop;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

// Đây là class để mã hoá mật khẩu (chỉ dùng cho debug)
public class PasswordEncoderTest {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = "12345678"; // Mật khẩu mới bạn muốn đặt
        String encodedPassword = encoder.encode(rawPassword);
        System.out.println("Encoded password: " + encodedPassword);
    }
}