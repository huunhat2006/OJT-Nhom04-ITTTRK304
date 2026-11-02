// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.response;

import com.example.bton.enums.GoalStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class SavingsGoalResponse {
    private Long id;
    private Long spaceId;
    private String name;
    private String description;
    private BigDecimal targetAmount;
    private BigDecimal currentAmount;
    private LocalDate startDate;
    private LocalDate deadline;
    private GoalStatus status;
    private String icon;
    private String color;
    // Calculated
    private BigDecimal progressPercentage;
    private BigDecimal remainingAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
