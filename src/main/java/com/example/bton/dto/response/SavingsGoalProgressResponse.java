// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
package com.example.bton.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class SavingsGoalProgressResponse {
    private Long goalId;
    private BigDecimal percent;
    private BigDecimal remainingAmount;
    private LocalDate estimatedCompletionDate;
    private Long daysLeft;
}
