// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.request.ChangePasswordRequest;
import com.example.bton.dto.request.LoginRequest;
import com.example.bton.dto.request.RegisterRequest;
import com.example.bton.dto.response.AuthResponse;
import com.example.bton.dto.response.UserResponse;
import com.example.bton.entity.FinancialSpace;
import com.example.bton.entity.RefreshToken;
import com.example.bton.entity.User;
import com.example.bton.entity.Wallet;
import com.example.bton.enums.Role;
import com.example.bton.enums.SpaceType;
import com.example.bton.enums.WalletType;
import com.example.bton.exception.BadRequestException;
import com.example.bton.exception.DuplicateResourceException;
import com.example.bton.exception.ResourceNotFoundException;
import com.example.bton.repository.FinancialSpaceRepository;
import com.example.bton.repository.RefreshTokenRepository;
import com.example.bton.repository.UserRepository;
import com.example.bton.repository.WalletRepository;
import com.example.bton.security.JwtTokenProvider;
import com.example.bton.security.UserPrincipal;
import com.example.bton.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Service
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final FinancialSpaceRepository spaceRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final WalletRepository walletRepository;

    public AuthServiceImpl(UserRepository userRepository,
                           FinancialSpaceRepository spaceRepository,
                           @Lazy PasswordEncoder passwordEncoder,
                           @Lazy AuthenticationManager authenticationManager,
                           JwtTokenProvider tokenProvider,
                           RefreshTokenRepository refreshTokenRepository,
                           WalletRepository walletRepository) {
        this.userRepository = userRepository;
        this.spaceRepository = spaceRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.refreshTokenRepository = refreshTokenRepository;
        this.walletRepository = walletRepository;
    }

    @Value("${app.jwt.refresh-expiration}")
    private long refreshExpirationMs;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username '" + request.getUsername() + "' is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email '" + request.getEmail() + "' is already registered");
        }

        String timezone = (request.getTimezone() != null && !request.getTimezone().isBlank())
                ? validateTimezone(request.getTimezone())
                : "Asia/Ho_Chi_Minh";

        // Create user - always assign USER role; ADMIN cannot be self-registered
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .timezone(timezone)
                .role(Role.USER)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        // Auto-create a personal financial space
        FinancialSpace personalSpace = FinancialSpace.builder()
                .name("Tài chính cá nhân")
                .description("Không gian tài chính cá nhân của " + user.getFullName())
                .type(SpaceType.PERSONAL)
                .currency("VND")
                .owner(user)
                .isActive(true)
                .build();
        personalSpace = spaceRepository.save(personalSpace);

        // UC01: auto-create a default cash wallet with 0 balance
        walletRepository.save(Wallet.builder()
                .user(user)
                .space(personalSpace)
                .name("Tiền mặt")
                .walletType(WalletType.CASH)
                .currency("VND")
                .balance(BigDecimal.ZERO)
                .isShared(false)
                .isActive(true)
                .build());

        log.info("New user registered: {} ({})", user.getUsername(), user.getEmail());

        // Auto-login after register
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        return buildAuthResponse(user, token);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsernameOrEmail(), request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(userPrincipal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userPrincipal.getId()));

        log.info("User logged in: {}", user.getUsername());

        return buildAuthResponse(user, token);
    }

    @Override
    @Transactional
    public AuthResponse refresh(String refreshTokenValue) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new BadRequestException(
                        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại. (FIN-NB11)"));

        if (Boolean.TRUE.equals(storedToken.getIsRevoked())
                || storedToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new BadRequestException(
                    "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại. (FIN-NB11)");
        }

        // Token rotation: revoke the used token and issue a new pair
        storedToken.setIsRevoked(true);
        refreshTokenRepository.save(storedToken);

        User user = storedToken.getUser();
        if (!user.getIsActive()) {
            throw new BadRequestException("Tài khoản đã bị vô hiệu hóa");
        }

        String newAccessToken = tokenProvider.generateTokenFromUserId(user.getId());
        log.info("Access token refreshed for user: {}", user.getUsername());
        return buildAuthResponse(user, newAccessToken);
    }

    @Override
    @Transactional
    public void logout(String refreshTokenValue) {
        if (refreshTokenValue != null && !refreshTokenValue.isBlank()) {
            refreshTokenRepository.findByToken(refreshTokenValue)
                    .ifPresent(token -> {
                        token.setIsRevoked(true);
                        refreshTokenRepository.save(token);
                    });
        }
        log.info("User logged out, refresh token revoked");
    }

    private AuthResponse buildAuthResponse(User user, String accessToken) {
        String refreshTokenValue = UUID.randomUUID().toString();
        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiryDate(LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000))
                .isRevoked(false)
                .build());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .timezone(user.getTimezone())
                .role(user.getRole())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed for user: {}", user.getUsername());
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .timezone(user.getTimezone())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private String validateTimezone(String timezone) {
        try {
            ZoneId.of(timezone);
            return timezone;
        } catch (Exception e) {
            throw new BadRequestException("Invalid timezone: " + timezone);
        }
    }

    /**
     * Tìm hoặc tạo user từ Google OAuth2 (upsert pattern).
     * - Nếu email đã tồn tại: cập nhật avatar, đảm bảo account active, trả token.
     * - Nếu chưa có: tạo user mới với random password (không dùng được để login thường),
     *   auto-tạo personal space + ví mặc định.
     */
    @Override
    @Transactional
    public User findOrCreateGoogleUser(String email, String name, String picture, String googleId) {
        User user = userRepository.findByEmail(email.toLowerCase()).orElse(null);

        if (user == null) {
            String baseUsername = email.split("@")[0].replaceAll("[^a-zA-Z0-9._]", "_");
            String username = baseUsername;
            int suffix = 1;
            while (userRepository.existsByUsername(username)) {
                username = baseUsername + suffix++;
            }

            user = User.builder()
                    .username(username)
                    .email(email.toLowerCase())
                    .passwordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                    .fullName(name != null ? name : username)
                    .avatarUrl(picture)
                    .timezone("Asia/Ho_Chi_Minh")
                    .role(Role.USER)
                    .isActive(true)
                    .build();
            user = userRepository.save(user);

            // Auto-tạo personal space
            FinancialSpace personalSpace = FinancialSpace.builder()
                    .name("Tài chính cá nhân")
                    .description("Không gian tài chính cá nhân của " + user.getFullName())
                    .type(SpaceType.PERSONAL)
                    .currency("VND")
                    .owner(user)
                    .isActive(true)
                    .build();
            personalSpace = spaceRepository.save(personalSpace);

            // Auto-tạo ví mặc định
            walletRepository.save(Wallet.builder()
                    .user(user)
                    .space(personalSpace)
                    .name("Tiền mặt")
                    .walletType(WalletType.CASH)
                    .currency("VND")
                    .balance(java.math.BigDecimal.ZERO)
                    .isShared(false)
                    .isActive(true)
                    .build());

            log.info("New user created via Google OAuth2: {} ({})", user.getUsername(), user.getEmail());
        } else {
            if (!user.getIsActive()) {
                throw new BadRequestException("Tài khoản đã bị vô hiệu hóa");
            }
            if (picture != null && !picture.equals(user.getAvatarUrl())) {
                user.setAvatarUrl(picture);
                userRepository.save(user);
            }
            log.info("Existing user logged in via Google OAuth2: {}", user.getEmail());
        }
        return user;
    }

    @Override
    @Transactional
    public AuthResponse generateAuthResponseForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        String accessToken = tokenProvider.generateTokenFromUserId(user.getId());
        return buildAuthResponse(user, accessToken);
    }

    @Override
    @Transactional
    public void markOtpVerified(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        user.setOtpVerifiedUntil(LocalDateTime.now().plusDays(30));
        userRepository.save(user);
        log.info("User {} ({}) verified OTP successfully, trusted until {}",
                user.getUsername(), user.getEmail(), user.getOtpVerifiedUntil());
    }

    @Override
    @Transactional
    public AuthResponse loginWithGoogle(String email, String name, String picture, String googleId) {
        User user = findOrCreateGoogleUser(email, name, picture, googleId);
        String accessToken = tokenProvider.generateTokenFromUserId(user.getId());
        return buildAuthResponse(user, accessToken);
    }
}
