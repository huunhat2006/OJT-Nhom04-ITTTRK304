package com.example.bton;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
        String hash = encoder.encode("Admin@1234");
        System.out.println("Hash: " + hash);
        
        // Also check if User@1234 matches
        System.out.println("Verify Admin@1234 against stored hash: " + encoder.matches("Admin@1234", hash));
    }
}