package com.example.bton;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {

    private static final Logger log = LoggerFactory.getLogger(PasswordHashGenerator.class);

    public static void main(String[] args) {
        if (args == null || args.length == 0) {
            log.info("Please provide an input string argument to hash.");
            return;
        }
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
        String hash = encoder.encode(args[0]);
        log.info("Generated hash: {}", hash);
        log.info("Verify against stored hash: {}", encoder.matches(args[0], hash));
    }
}
