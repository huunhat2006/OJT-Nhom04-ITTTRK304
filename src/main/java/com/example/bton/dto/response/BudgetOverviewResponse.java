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
public class BudgetOverviewResponse {

    private int month;
    private int year;
    private String monthFormatted; // "YYYY-MM"
    private BigDecimal totalBudget; // tổng ngân sách
    private BigDecimal totalSpent;  // tổng đã chi
    private BigDecimal remainingAmount; // số tiền còn lại
    private BigDecimal remainingPercentage; // % còn lại
    private BigDecimal usagePercentage;     // % đã chi
    private int totalBudgets;
    private int okCount;
    private int warningCount;
    private int exceededCount;
}

