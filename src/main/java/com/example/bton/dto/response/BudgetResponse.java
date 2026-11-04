// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetResponse {
    private Long id;
    private Long spaceId;
    private Long userId;
    private Long categoryId;
    private CategoryResponse category;
    private BigDecimal amount;
    private BigDecimal limitAmount; // alias for amount
    private int month;
    private int year;
    private String monthFormatted; // "YYYY-MM"
    private BigDecimal warningThreshold;
    // Calculated fields
    private BigDecimal spent;
    private BigDecimal totalSpent; // alias for spent
    private BigDecimal remaining;
    private BigDecimal usagePercentage;
    private String status; // OK, WARNING, EXCEEDED
}
