// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final EmailService emailService;
    private final SecureRandom random = new SecureRandom();

    @Data
    @AllArgsConstructor
    private static class OtpEntry {
        private String otp;
        private Long userId;
        private String email;
        private LocalDateTime expiresAt;
    }

    // Lưu tạm OTP trong memory (hết hạn sau 5 phút)
    private final Map<String, OtpEntry> otpCache = new ConcurrentHashMap<>();

    /**
     * Tạo mã OTP 6 số và gửi qua email
     * @return otpSessionId (dùng để định danh phiên OTP)
     */
    public String generateAndSendOtp(Long userId, String email, String fullName) {
        String otp = String.format("%06d", random.nextInt(1_000_000));
        String sessionId = java.util.UUID.randomUUID().toString();

        otpCache.put(sessionId, new OtpEntry(otp, userId, email, LocalDateTime.now().plusMinutes(5)));

        // Gửi email
        emailService.sendLoginOtpEmail(email, fullName, otp);

        log.info("Generated login OTP for user {} ({}) with sessionId: {}", userId, email, sessionId);
        return sessionId;
    }

    /**
     * Xác thực mã OTP
     * @return userId nếu OTP đúng, null nếu sai hoặc hết hạn
     */
    public Long verifyOtp(String sessionId, String otpCode) {
        if (sessionId == null || otpCode == null) {
            return null;
        }

        OtpEntry entry = otpCache.get(sessionId);
        if (entry == null) {
            return null;
        }

        if (LocalDateTime.now().isAfter(entry.getExpiresAt())) {
            otpCache.remove(sessionId);
            return null;
        }

        if (entry.getOtp().equals(otpCode.trim())) {
            otpCache.remove(sessionId);
            return entry.getUserId();
        }

        return null;
    }

    /**
     * Gửi lại mã OTP
     */
    public boolean resendOtp(String sessionId) {
        OtpEntry entry = otpCache.get(sessionId);
        if (entry == null) {
            return false;
        }

        String newOtp = String.format("%06d", random.nextInt(1_000_000));
        entry.setOtp(newOtp);
        entry.setExpiresAt(LocalDateTime.now().plusMinutes(5));

        emailService.sendLoginOtpEmail(entry.getEmail(), entry.getEmail(), newOtp);
        log.info("Resent OTP for sessionId: {}", sessionId);
        return true;
    }
}

