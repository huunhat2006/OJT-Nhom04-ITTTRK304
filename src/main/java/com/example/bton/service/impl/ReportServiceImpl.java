// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.response.*;
import com.example.bton.entity.FinancialSpace;
import com.example.bton.enums.SpaceType;
import com.example.bton.enums.TransactionType;
import com.example.bton.repository.FinancialSpaceRepository;
import com.example.bton.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl {

    private final TransactionRepository transactionRepository;
    private final BudgetServiceImpl budgetService;
    private final SavingsGoalServiceImpl savingsGoalService;
    private final FinancialSpaceServiceImpl spaceService;
    private final FinancialSpaceRepository spaceRepository;

    @Transactional(readOnly = true)
    public List<MonthlyReportResponse> getMonthlyReports(Long spaceId, Long userId, Integer year) {
        int targetYear = (year != null && year > 0) ? year : LocalDate.now().getYear();
        Long targetSpaceId = resolveSpaceId(spaceId, userId);
        if (targetSpaceId != null) {
            spaceService.verifySpaceAccess(targetSpaceId, userId);
        }

        List<Object[]> raw = transactionRepository.findMonthlyTotalsByYear(
                targetSpaceId, (targetSpaceId == null ? userId : null), targetYear);

        Map<Integer, BigDecimal[]> monthMap = new HashMap<>();
        for (Object[] row : raw) {
            int m = ((Number) row[0]).intValue();
            BigDecimal inc = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
            BigDecimal exp = row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO;
            monthMap.put(m, new BigDecimal[]{inc, exp});
        }

        List<MonthlyReportResponse> result = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            BigDecimal[] vals = monthMap.getOrDefault(m, new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            BigDecimal inc = vals[0];
            BigDecimal exp = vals[1];
            result.add(MonthlyReportResponse.builder()
                    .month(m)
                    .year(targetYear)
                    .income(inc)
                    .expense(exp)
                    .balance(inc.subtract(exp))
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<DailyReportResponse> getDailyReports(Long spaceId, Long userId, LocalDate from, LocalDate to) {
        LocalDate fromDate = (from != null) ? from : LocalDate.now().withDayOfMonth(1);
        LocalDate toDate = (to != null) ? to : LocalDate.now();
        if (fromDate.isAfter(toDate)) {
            LocalDate tmp = fromDate;
            fromDate = toDate;
            toDate = tmp;
        }

        Long targetSpaceId = resolveSpaceId(spaceId, userId);
        if (targetSpaceId != null) {
            spaceService.verifySpaceAccess(targetSpaceId, userId);
        }

        List<Object[]> raw = transactionRepository.findDailyTotalsByDateRange(
                targetSpaceId, (targetSpaceId == null ? userId : null), fromDate, toDate);

        Map<LocalDate, BigDecimal[]> dayMap = new HashMap<>();
        for (Object[] row : raw) {
            LocalDate d = (row[0] instanceof java.sql.Date) ? ((java.sql.Date) row[0]).toLocalDate() : (LocalDate) row[0];
            BigDecimal inc = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
            BigDecimal exp = row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO;
            dayMap.put(d, new BigDecimal[]{inc, exp});
        }

        List<DailyReportResponse> result = new ArrayList<>();
        LocalDate curr = fromDate;
        while (!curr.isAfter(toDate)) {
            BigDecimal[] vals = dayMap.getOrDefault(curr, new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            BigDecimal inc = vals[0];
            BigDecimal exp = vals[1];
            result.add(DailyReportResponse.builder()
                    .date(curr)
                    .income(inc)
                    .expense(exp)
                    .balance(inc.subtract(exp))
                    .build());
            curr = curr.plusDays(1);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<CategoryReportResponse> getCategoryReports(Long spaceId, Long userId, String typeStr, LocalDate from, LocalDate to) {
        LocalDate fromDate = (from != null) ? from : LocalDate.now().withDayOfMonth(1);
        LocalDate toDate = (to != null) ? to : LocalDate.now();
        if (fromDate.isAfter(toDate)) {
            LocalDate tmp = fromDate;
            fromDate = toDate;
            toDate = tmp;
        }

        TransactionType type = null;
        if (typeStr != null && !typeStr.isBlank()) {
            try {
                type = TransactionType.valueOf(typeStr.toUpperCase().trim());
            } catch (Exception ignored) {}
        }
        if (type == null) {
            type = TransactionType.EXPENSE;
        }

        Long targetSpaceId = resolveSpaceId(spaceId, userId);
        if (targetSpaceId != null) {
            spaceService.verifySpaceAccess(targetSpaceId, userId);
        }

        List<Object[]> raw = transactionRepository.findCategoryTotalsByDateRange(
                targetSpaceId, (targetSpaceId == null ? userId : null), type, fromDate, toDate);

        BigDecimal totalSum = BigDecimal.ZERO;
        for (Object[] row : raw) {
            BigDecimal amt = row[5] != null ? (BigDecimal) row[5] : BigDecimal.ZERO;
            totalSum = totalSum.add(amt);
        }

        List<CategoryReportResponse> result = new ArrayList<>();
        for (Object[] row : raw) {
            Long catId = row[0] != null ? ((Number) row[0]).longValue() : null;
            String name = row[1] != null ? row[1].toString() : "Khác";
            String nameVi = row[2] != null ? row[2].toString() : name;
            String color = row[3] != null ? row[3].toString() : "#6B7280";
            String icon = row[4] != null ? row[4].toString() : "more";
            BigDecimal amount = row[5] != null ? (BigDecimal) row[5] : BigDecimal.ZERO;

            BigDecimal percentage = BigDecimal.ZERO;
            if (totalSum.compareTo(BigDecimal.ZERO) > 0) {
                percentage = amount.divide(totalSum, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .setScale(2, RoundingMode.HALF_UP);
            }

            result.add(CategoryReportResponse.builder()
                    .category(nameVi != null ? nameVi : name)
                    .categoryId(catId)
                    .categoryName(name)
                    .categoryNameVi(nameVi)
                    .icon(icon)
                    .color(color)
                    .totalAmount(amount)
                    .percentage(percentage)
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public ComparisonReportResponse getComparison(Long spaceId, Long userId, Integer month, Integer year) {
        int targetMonth = (month != null && month >= 1 && month <= 12) ? month : LocalDate.now().getMonthValue();
        int targetYear = (year != null && year > 0) ? year : LocalDate.now().getYear();

        int prevMonth = (targetMonth == 1) ? 12 : targetMonth - 1;
        int prevYear = (targetMonth == 1) ? targetYear - 1 : targetYear;

        Long targetSpaceId = resolveSpaceId(spaceId, userId);
        if (targetSpaceId != null) {
            spaceService.verifySpaceAccess(targetSpaceId, userId);
        }

        // Current month
        BigDecimal currentIncome = transactionRepository
                .sumBySpaceOrUserAndTypeAndMonth(targetSpaceId, (targetSpaceId == null ? userId : null), TransactionType.INCOME, targetYear, targetMonth);
        if (currentIncome == null) currentIncome = BigDecimal.ZERO;

        BigDecimal currentExpense = transactionRepository
                .sumBySpaceOrUserAndTypeAndMonth(targetSpaceId, (targetSpaceId == null ? userId : null), TransactionType.EXPENSE, targetYear, targetMonth);
        if (currentExpense == null) currentExpense = BigDecimal.ZERO;

        BigDecimal currentBalance = currentIncome.subtract(currentExpense);
        BigDecimal currentSavingsRate = BigDecimal.ZERO;
        if (currentIncome.compareTo(BigDecimal.ZERO) > 0) {
            currentSavingsRate = currentBalance.divide(currentIncome, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
        }

        // Previous month
        BigDecimal prevIncome = transactionRepository
                .sumBySpaceOrUserAndTypeAndMonth(targetSpaceId, (targetSpaceId == null ? userId : null), TransactionType.INCOME, prevYear, prevMonth);
        if (prevIncome == null) prevIncome = BigDecimal.ZERO;

        BigDecimal prevExpense = transactionRepository
                .sumBySpaceOrUserAndTypeAndMonth(targetSpaceId, (targetSpaceId == null ? userId : null), TransactionType.EXPENSE, prevYear, prevMonth);
        if (prevExpense == null) prevExpense = BigDecimal.ZERO;

        BigDecimal prevBalance = prevIncome.subtract(prevExpense);
        BigDecimal prevSavingsRate = BigDecimal.ZERO;
        if (prevIncome.compareTo(BigDecimal.ZERO) > 0) {
            prevSavingsRate = prevBalance.divide(prevIncome, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
        }

        // Differences
        BigDecimal incomeDiffAbs = currentIncome.subtract(prevIncome);
        BigDecimal incomeDiffPct = (prevIncome.compareTo(BigDecimal.ZERO) > 0)
                ? incomeDiffAbs.divide(prevIncome, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal expenseDiffAbs = currentExpense.subtract(prevExpense);
        BigDecimal expenseDiffPct = (prevExpense.compareTo(BigDecimal.ZERO) > 0)
                ? expenseDiffAbs.divide(prevExpense, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal balanceDiffAbs = currentBalance.subtract(prevBalance);
        BigDecimal balanceDiffPct = (prevBalance.compareTo(BigDecimal.ZERO) != 0)
                ? balanceDiffAbs.divide(prevBalance.abs(), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal savingsRateChange = currentSavingsRate.subtract(prevSavingsRate);

        return ComparisonReportResponse.builder()
                .currentMonth(targetMonth)
                .currentYear(targetYear)
                .previousMonth(prevMonth)
                .previousYear(prevYear)
                .currentIncome(currentIncome)
                .previousIncome(prevIncome)
                .incomeChangeAbsolute(incomeDiffAbs)
                .incomeChangePercent(incomeDiffPct)
                .currentExpense(currentExpense)
                .previousExpense(prevExpense)
                .expenseChangeAbsolute(expenseDiffAbs)
                .expenseChangePercent(expenseDiffPct)
                .currentBalance(currentBalance)
                .previousBalance(prevBalance)
                .balanceChangeAbsolute(balanceDiffAbs)
                .balanceChangePercent(balanceDiffPct)
                .currentSavingsRate(currentSavingsRate)
                .previousSavingsRate(prevSavingsRate)
                .savingsRateChange(savingsRateChange)
                .build();
    }



    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long spaceId, Long userId, int month, int year) {
        spaceService.verifySpaceAccess(spaceId, userId);

        BigDecimal totalIncome = transactionRepository
                .sumBySpaceAndTypeAndMonth(spaceId, TransactionType.INCOME, year, month);
        if (totalIncome == null) totalIncome = BigDecimal.ZERO;

        BigDecimal totalExpense = transactionRepository
                .sumBySpaceAndTypeAndMonth(spaceId, TransactionType.EXPENSE, year, month);
        if (totalExpense == null) totalExpense = BigDecimal.ZERO;

        BigDecimal balance = totalIncome.subtract(totalExpense);

        // Expense by category
        List<Object[]> rawCategoryExpenses = transactionRepository
                .findExpenseByCategory(spaceId, year, month);
        List<DashboardResponse.CategoryExpenseResponse> categoryExpenses = buildCategoryExpenses(
                rawCategoryExpenses, totalExpense);

        // Budgets with warnings
        var budgets = budgetService.getBudgets(spaceId, userId, month, year);
        var warnings = budgets.stream()
                .filter(b -> "WARNING".equals(b.getStatus()) || "EXCEEDED".equals(b.getStatus()))
                .collect(Collectors.toList());

        // Savings goals
        var goals = savingsGoalService.getGoals(spaceId, userId);

        // Recent 10 transactions
        var recent = transactionRepository.findRecentBySpace(spaceId, PageRequest.of(0, 10));
        var recentResponses = recent.stream()
                .map(TransactionServiceImpl::mapToResponseStatic)
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .month(month)
                .year(year)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .balance(balance)
                .expenseByCategory(categoryExpenses)
                .budgets(budgets)
                .budgetWarnings(warnings)
                .savingsGoals(goals)
                .recentTransactions(recentResponses)
                .build();
    }

    @Transactional(readOnly = true)
    public ReportResponse getReport(Long spaceId, Long userId,
                                    LocalDate startDate, LocalDate endDate) {
        spaceService.verifySpaceAccess(spaceId, userId);

        List<Object[]> monthlyData = transactionRepository.findMonthlyTotals(spaceId, startDate, endDate);

        List<ReportResponse.MonthlySummary> summaries = new ArrayList<>();
        List<ReportResponse.TrendData> trends = new ArrayList<>();
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;

        for (Object[] row : monthlyData) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            BigDecimal income = row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO;
            BigDecimal expense = row[3] != null ? (BigDecimal) row[3] : BigDecimal.ZERO;

            totalIncome = totalIncome.add(income);
            totalExpense = totalExpense.add(expense);

            summaries.add(ReportResponse.MonthlySummary.builder()
                    .year(year).month(month).income(income)
                    .expense(expense).balance(income.subtract(expense)).build());

            trends.add(ReportResponse.TrendData.builder()
                    .label(year + "-" + String.format("%02d", month))
                    .income(income).expense(expense)
                    .balance(income.subtract(expense)).build());
        }

        List<Object[]> rawCategoryExpenses = transactionRepository.findExpenseByCategory(
                spaceId, endDate.getYear(), endDate.getMonthValue());
        List<ReportResponse.CategoryBreakdown> catBreakdowns = buildCategoryBreakdowns(
                rawCategoryExpenses, totalExpense);

        return ReportResponse.builder()
                .monthlySummaries(summaries)
                .trends(trends)
                .expenseByCategory(catBreakdowns)
                .incomeByCategory(List.of())
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .totalBalance(totalIncome.subtract(totalExpense))
                .build();
    }

    private List<DashboardResponse.CategoryExpenseResponse> buildCategoryExpenses(
            List<Object[]> rawData, BigDecimal totalExpense) {
        return rawData.stream().map(row -> {
            Long catId = ((Number) row[0]).longValue();
            String name = (String) row[1];
            String nameVi = (String) row[2];
            String color = (String) row[3];
            String icon = (String) row[4];
            BigDecimal amount = (BigDecimal) row[5];
            BigDecimal pct = totalExpense.compareTo(BigDecimal.ZERO) > 0
                    ? amount.multiply(new BigDecimal("100"))
                    .divide(totalExpense, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            return DashboardResponse.CategoryExpenseResponse.builder()
                    .categoryId(catId).categoryName(name).categoryNameVi(nameVi)
                    .color(color).icon(icon).amount(amount).percentage(pct).build();
        }).collect(Collectors.toList());
    }

    private List<ReportResponse.CategoryBreakdown> buildCategoryBreakdowns(
            List<Object[]> rawData, BigDecimal totalExpense) {
        return rawData.stream().map(row -> {
            Long catId = ((Number) row[0]).longValue();
            String name = (String) row[1];
            String nameVi = (String) row[2];
            String color = (String) row[3];
            String icon = (String) row[4];
            BigDecimal amount = (BigDecimal) row[5];
            BigDecimal pct = totalExpense.compareTo(BigDecimal.ZERO) > 0
                    ? amount.multiply(new BigDecimal("100"))
                    .divide(totalExpense, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            return ReportResponse.CategoryBreakdown.builder()
                    .categoryId(catId).categoryName(name).categoryNameVi(nameVi)
                    .color(color).icon(icon).amount(amount).percentage(pct).build();
        }).collect(Collectors.toList());
    }

    private Long resolveSpaceId(Long spaceId, Long userId) {
        if (spaceId != null) {
            return spaceId;
        }
        return spaceRepository.findFirstByOwnerIdAndTypeAndIsActiveTrue(userId, SpaceType.PERSONAL)
                .map(FinancialSpace::getId)
                .orElse(null);
    }
}
