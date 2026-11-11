// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.auditing.DateTimeProvider;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.TimeZone;

@SpringBootApplication
@EnableJpaAuditing(dateTimeProviderRef = "auditingDateTimeProvider")
@EnableScheduling
@EnableAsync
public class BtonApplication {

    public static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone(VIETNAM_ZONE));
    }

    @Bean(name = "auditingDateTimeProvider")
    public DateTimeProvider dateTimeProvider() {
        return () -> Optional.of(LocalDateTime.now(VIETNAM_ZONE));
    }

    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone(VIETNAM_ZONE));
        SpringApplication.run(BtonApplication.class, args);
    }
}
