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
public class ComparisonReportResponse {
    private int currentMonth;
    private int currentYear;
    private int previousMonth;
    private int previousYear;

    private BigDecimal currentIncome;
    private BigDecimal previousIncome;
    private BigDecimal incomeChangeAbsolute;
    private BigDecimal incomeChangePercent;

    private BigDecimal currentExpense;
    private BigDecimal previousExpense;
    private BigDecimal expenseChangeAbsolute;
    private BigDecimal expenseChangePercent;

    private BigDecimal currentBalance;
    private BigDecimal previousBalance;
    private BigDecimal balanceChangeAbsolute;
    private BigDecimal balanceChangePercent;

    private BigDecimal currentSavingsRate;
    private BigDecimal previousSavingsRate;
    private BigDecimal savingsRateChange;
}
