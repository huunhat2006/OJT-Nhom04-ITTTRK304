// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableJpaAuditing
@EnableScheduling
public class BtonApplication {

    public static void main(String[] args) {
        SpringApplication.run(BtonApplication.class, args);
    }
}
