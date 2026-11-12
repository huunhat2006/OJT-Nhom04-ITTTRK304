// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    // Nullable — không bắt buộc nếu user chưa có mật khẩu (đăng nhập bằng Google)
    private String currentPassword;

    @NotBlank(message = "New password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, and one number")
    private String newPassword;
}
