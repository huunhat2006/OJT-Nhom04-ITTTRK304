// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ReportResponse {

    // Monthly summary
    @Data
    @Builder
    public static class MonthlySummary {
        private int year;
        private int month;
        private BigDecimal income;
        private BigDecimal expense;
        private BigDecimal balance;
    }

    // Category breakdown
    @Data
    @Builder
    public static class CategoryBreakdown {
        private Long categoryId;
        private String categoryName;
        private String categoryNameVi;
        private String color;
        private String icon;
        private BigDecimal amount;
        private BigDecimal percentage;
    }

    // Trend data
    @Data
    @Builder
    public static class TrendData {
        private String label;
        private BigDecimal income;
        private BigDecimal expense;
        private BigDecimal balance;
    }

    private List<MonthlySummary> monthlySummaries;
    private List<CategoryBreakdown> expenseByCategory;
    private List<CategoryBreakdown> incomeByCategory;
    private List<TrendData> trends;
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal totalBalance;
}
