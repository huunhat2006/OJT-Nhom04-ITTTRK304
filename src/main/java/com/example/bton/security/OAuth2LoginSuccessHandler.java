// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.security;

import com.example.bton.dto.response.AuthResponse;
import com.example.bton.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * Sau khi Google xác thực thành công, handler này:
 * 1. Lấy thông tin user từ Google
 * 2. Tìm hoặc tạo user trong DB (upsert)
 * 3. Tạo JWT + refresh token
 * 4. Redirect về frontend kèm token trong query param
 */
@Component
@Slf4j
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final String OAUTH2_CALLBACK_PATH = "/oauth2/callback";

    private final AuthService authService;
    private final CookieOAuth2AuthorizationRequestRepository cookieRepo;
    private final com.example.bton.service.OtpService otpService;

    public OAuth2LoginSuccessHandler(@Lazy AuthService authService,
                                     CookieOAuth2AuthorizationRequestRepository cookieRepo,
                                     com.example.bton.service.OtpService otpService) {
        this.authService = authService;
        this.cookieRepo = cookieRepo;
        this.otpService = otpService;
    }

    @Value("${app.oauth2.frontend-redirect-uri:http://localhost:5173/oauth2/callback}")
    private String frontendRedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email    = oAuth2User.getAttribute("email");
        String name     = oAuth2User.getAttribute("name");
        String picture  = oAuth2User.getAttribute("picture");
        String googleId = oAuth2User.getAttribute("sub");

        log.info("OAuth2 login success: email={}", email);

        // Xác định base frontend redirect URL chuẩn xác (loại bỏ :80 nếu có)
        String baseFrontendUrl = CookieOAuth2AuthorizationRequestRepository
                .getCookieValue(request, CookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_COOKIE)
                .orElse(frontendRedirectUri != null && !frontendRedirectUri.isBlank() ? frontendRedirectUri : "https://budgivee.online/oauth2/callback");

        if (baseFrontendUrl.contains(":80/")) {
            baseFrontendUrl = baseFrontendUrl.replace(":80/", "/");
        }

        // Xóa cookie sau khi dùng (bọc try-catch an toàn)
        try {
            cookieRepo.removeAuthorizationRequest(request, response);
        } catch (Exception ignored) {
            log.debug("Failed to remove OAuth2 cookie: {}", ignored.getMessage());
        }

        try {
            // 1. Tìm hoặc tạo user với avatar từ Google
            com.example.bton.entity.User user = authService.findOrCreateGoogleUser(email, name, picture, googleId);

            // Kiểm tra xem tài khoản này đã xác thực OTP trong vòng 30 ngày (1 tháng) chưa
            boolean isOtpVerified = user.getOtpVerifiedUntil() != null
                    && java.time.LocalDateTime.now().isBefore(user.getOtpVerifiedUntil());

            if (isOtpVerified) {
                log.info("User {} ({}) da xac thuc OTP trong 30 ngay (han den {}), bo qua buoc OTP",
                        user.getUsername(), user.getEmail(), user.getOtpVerifiedUntil());

                AuthResponse authResponse = authService.generateAuthResponseForUser(user.getId());
                String redirectUrl = UriComponentsBuilder.fromUriString(baseFrontendUrl)
                        .replacePath(OAUTH2_CALLBACK_PATH)
                        .queryParam("token", authResponse.getAccessToken())
                        .queryParam("refreshToken", authResponse.getRefreshToken())
                        .build().toUriString();

                getRedirectStrategy().sendRedirect(request, response, redirectUrl);
                return;
            }

            // 2. Chưa xác thực hoặc đã hết hạn 30 ngày -> Tạo mã OTP gửi về email người dùng
            String otpSessionId = otpService.generateAndSendOtp(user.getId(), user.getEmail(), user.getFullName());

            // 3. Chuyển hướng về trang OTP verification trên frontend
            String redirectUrl = UriComponentsBuilder.fromUriString(baseFrontendUrl)
                    .replacePath(OAUTH2_CALLBACK_PATH)
                    .queryParam("otpRequired", "true")
                    .queryParam("sessionId", otpSessionId)
                    .queryParam("email", email)
                    .build().toUriString();

            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        } catch (Exception e) {
            log.error("OAuth2 login failed: ", e);
            String msg = e.getMessage() != null ? e.getMessage() : "oauth2_failed";
            String errorUrl = UriComponentsBuilder.fromUriString(baseFrontendUrl)
                    .replacePath(OAUTH2_CALLBACK_PATH)
                    .queryParam("error", msg)
                    .build().toUriString();
            getRedirectStrategy().sendRedirect(request, response, errorUrl);
        }
    }
}
