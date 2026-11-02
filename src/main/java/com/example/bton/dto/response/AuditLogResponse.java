// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogResponse {
    private Long id;
    private Long adminId;
    private String adminUsername;
    private String adminFullName;
    private String action;
    private String targetType;
    private Long targetId;
    private String description;
    private String ipAddress;
    private LocalDateTime createdAt;
}
