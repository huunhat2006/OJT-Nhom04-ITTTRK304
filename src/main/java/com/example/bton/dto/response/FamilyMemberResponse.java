// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.response;

import com.example.bton.enums.FamilyRole;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FamilyMemberResponse {
    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private String avatarUrl;
    private FamilyRole role;
    private LocalDateTime joinedAt;
    private Boolean isActive;
}
