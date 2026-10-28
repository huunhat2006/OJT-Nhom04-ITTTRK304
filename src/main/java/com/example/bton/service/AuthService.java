// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service;

import com.example.bton.dto.request.ChangePasswordRequest;
import com.example.bton.dto.request.LoginRequest;
import com.example.bton.dto.request.RegisterRequest;
import com.example.bton.dto.response.AuthResponse;
import com.example.bton.dto.response.UserResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(String refreshToken);
    void logout(String refreshToken);
    UserResponse getCurrentUser(Long userId);
    void changePassword(Long userId, ChangePasswordRequest request);
}
