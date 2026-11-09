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

    private final AuthService authService;
    private final CookieOAuth2AuthorizationRequestRepository cookieRepo;

    public OAuth2LoginSuccessHandler(@Lazy AuthService authService,
                                     CookieOAuth2AuthorizationRequestRepository cookieRepo) {
        this.authService = authService;
        this.cookieRepo = cookieRepo;
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

        // Tìm redirect URI từ cookie (nếu frontend truyền redirect_uri param)
        String targetUrl = CookieOAuth2AuthorizationRequestRepository
                .getCookieValue(request, CookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_COOKIE)
                .orElse(frontendRedirectUri);

        // Xóa cookie sau khi dùng (bọc try-catch an toàn)
        try {
            cookieRepo.removeAuthorizationRequest(request, response);
        } catch (Exception ignored) {
        }

        try {
            AuthResponse authResponse = authService.loginWithGoogle(email, name, picture, googleId);

            String redirectUrl = UriComponentsBuilder.fromUriString(targetUrl)
                    .queryParam("token", authResponse.getAccessToken())
                    .queryParam("refreshToken", authResponse.getRefreshToken())
                    .build().toUriString();

            getRedirectStrategy().sendRedirect(request, response, redirectUrl);
        } catch (Exception e) {
            log.error("OAuth2 login failed: ", e);
            String errorUrl = UriComponentsBuilder.fromUriString(targetUrl)
                    .queryParam("error", "oauth2_failed")
                    .build().toUriString();
            getRedirectStrategy().sendRedirect(request, response, errorUrl);
        }
    }
}
