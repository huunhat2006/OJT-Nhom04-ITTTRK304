// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardResponse {
    private int month;
    private int year;
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal balance;
    private List<CategoryExpenseResponse> expenseByCategory;
    private List<BudgetResponse> budgets;
    private List<BudgetResponse> budgetWarnings;
    private List<SavingsGoalResponse> savingsGoals;
    private List<TransactionResponse> recentTransactions;

    @Data
    @Builder
    public static class CategoryExpenseResponse {
        private Long categoryId;
        private String categoryName;
        private String categoryNameVi;
        private String color;
        private String icon;
        private BigDecimal amount;
        private BigDecimal percentage;
    }
}
