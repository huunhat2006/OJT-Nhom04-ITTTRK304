// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class BudgetResponse {
    private Long id;
    private Long spaceId;
    private CategoryResponse category;
    private BigDecimal amount;
    private int month;
    private int year;
    private BigDecimal warningThreshold;
    // Calculated fields
    private BigDecimal spent;
    private BigDecimal remaining;
    private BigDecimal usagePercentage;
    private String status; // NORMAL, WARNING, EXCEEDED
}
