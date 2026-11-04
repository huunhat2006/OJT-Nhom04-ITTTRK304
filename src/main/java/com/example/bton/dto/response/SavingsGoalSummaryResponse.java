// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
package com.example.bton.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class SavingsGoalSummaryResponse {
    private long totalGoals;
    private long completedGoals;
    private BigDecimal totalSaved;
    private BigDecimal totalTarget;
}
