// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.response;

import com.example.bton.enums.SpaceType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class FinancialSpaceResponse {
    private Long id;
    private String name;
    private String description;
    private SpaceType type;
    private String currency;
    private Long ownerId;
    private String ownerName;
    private String inviteCode;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private List<FamilyMemberResponse> members;
}
