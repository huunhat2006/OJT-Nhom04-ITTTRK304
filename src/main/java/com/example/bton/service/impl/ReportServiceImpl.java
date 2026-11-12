// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.response.*;
import com.example.bton.entity.FinancialSpace;
import com.example.bton.entity.User;
import com.example.bton.enums.SpaceType;
import com.example.bton.enums.TransactionType;
import com.example.bton.repository.FinancialSpaceRepository;
import com.example.bton.repository.TransactionRepository;
import com.example.bton.repository.UserRepository;
import com.example.bton.service.ReportExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl {

    private final TransactionRepository transactionRepository;
    private final BudgetServiceImpl budgetService;
    private final SavingsGoalServiceImpl savingsGoalService;
    private final FinancialSpaceServiceImpl spaceService;
    private final FinancialSpaceRepository spaceRepository;
    private final UserRepository userRepository;
    private final ReportExportService reportExportService;

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
            LocalDate d = (row[0] instanceof java.sql.Date date) ? date.toLocalDate() : (LocalDate) row[0];
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

        TransactionType type = parseTransactionType(typeStr);

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
            result.add(mapToCategoryReport(row, totalSum));
        }
        return result;
    }

    private TransactionType parseTransactionType(String typeStr) {
        if (typeStr != null && !typeStr.isBlank()) {
            try {
                return TransactionType.valueOf(typeStr.toUpperCase().trim());
            } catch (Exception ignored) {
                // Invalid transaction type falls back to EXPENSE
            }
        }
        return TransactionType.EXPENSE;
    }

    private CategoryReportResponse mapToCategoryReport(Object[] row, BigDecimal totalSum) {
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

        return CategoryReportResponse.builder()
                .category(nameVi != null ? nameVi : name)
                .categoryId(catId)
                .categoryName(name)
                .categoryNameVi(nameVi)
                .icon(icon)
                .color(color)
                .totalAmount(amount)
                .percentage(percentage)
                .build();
    }

    private record MonthlyTotals(BigDecimal income, BigDecimal expense, BigDecimal balance, BigDecimal savingsRate) {}

    private MonthlyTotals calculateMonthTotals(Long targetSpaceId, Long userId, int year, int month) {
        BigDecimal income = transactionRepository
                .sumBySpaceOrUserAndTypeAndMonth(targetSpaceId, (targetSpaceId == null ? userId : null), TransactionType.INCOME, year, month);
        if (income == null) income = BigDecimal.ZERO;

        BigDecimal expense = transactionRepository
                .sumBySpaceOrUserAndTypeAndMonth(targetSpaceId, (targetSpaceId == null ? userId : null), TransactionType.EXPENSE, year, month);
        if (expense == null) expense = BigDecimal.ZERO;

        BigDecimal balance = income.subtract(expense);
        BigDecimal savingsRate = BigDecimal.ZERO;
        if (income.compareTo(BigDecimal.ZERO) > 0) {
            savingsRate = balance.divide(income, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
        }
        return new MonthlyTotals(income, expense, balance, savingsRate);
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

        MonthlyTotals current = calculateMonthTotals(targetSpaceId, userId, targetYear, targetMonth);
        MonthlyTotals prev = calculateMonthTotals(targetSpaceId, userId, prevYear, prevMonth);

        // Differences
        BigDecimal incomeDiffAbs = current.income().subtract(prev.income());
        BigDecimal incomeDiffPct = (prev.income().compareTo(BigDecimal.ZERO) > 0)
                ? incomeDiffAbs.divide(prev.income(), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal expenseDiffAbs = current.expense().subtract(prev.expense());
        BigDecimal expenseDiffPct = (prev.expense().compareTo(BigDecimal.ZERO) > 0)
                ? expenseDiffAbs.divide(prev.expense(), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal balanceDiffAbs = current.balance().subtract(prev.balance());
        BigDecimal balanceDiffPct = (prev.balance().compareTo(BigDecimal.ZERO) != 0)
                ? balanceDiffAbs.divide(prev.balance().abs(), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal savingsRateChange = current.savingsRate().subtract(prev.savingsRate());

        return ComparisonReportResponse.builder()
                .currentMonth(targetMonth)
                .currentYear(targetYear)
                .previousMonth(prevMonth)
                .previousYear(prevYear)
                .currentIncome(current.income())
                .previousIncome(prev.income())
                .incomeChangeAbsolute(incomeDiffAbs)
                .incomeChangePercent(incomeDiffPct)
                .currentExpense(current.expense())
                .previousExpense(prev.expense())
                .expenseChangeAbsolute(expenseDiffAbs)
                .expenseChangePercent(expenseDiffPct)
                .currentBalance(current.balance())
                .previousBalance(prev.balance())
                .balanceChangeAbsolute(balanceDiffAbs)
                .balanceChangePercent(balanceDiffPct)
                .currentSavingsRate(current.savingsRate())
                .previousSavingsRate(prev.savingsRate())
                .savingsRateChange(savingsRateChange)
                .build();
    }

    @Cacheable(value = "reportExport", key = "(#spaceId != null ? #spaceId : 0) + '_' + #userId + '_' + #format.toLowerCase() + '_' + (#from != null ? #from.toString() : 'all') + '_' + (#to != null ? #to.toString() : 'all')")
    @Transactional(readOnly = true)
    public byte[] exportReport(Long spaceId, Long userId, String format, LocalDate from, LocalDate to) {
        Long targetSpaceId = resolveSpaceId(spaceId, userId);
        FinancialSpace space = null;
        if (targetSpaceId != null) {
            spaceService.verifySpaceAccess(targetSpaceId, userId);
            space = spaceRepository.findById(targetSpaceId).orElse(null);
        }

        User user = userRepository.findById(userId).orElse(null);
        var transactions = transactionRepository.findForExport(targetSpaceId, (targetSpaceId == null ? userId : null), from, to);

        if ("pdf".equalsIgnoreCase(format)) {
            return reportExportService.exportToPdf(user, space, transactions, from, to);
        }
        return reportExportService.exportToExcel(user, space, transactions, from, to);
    }

    @Transactional(readOnly = true)
    public byte[] exportTransactionsToExcel(Long spaceId, Long userId, LocalDate startDate, LocalDate endDate) {
        return exportReport(spaceId, userId, "excel", startDate, endDate);
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
                .toList();

        // Savings goals
        var goals = savingsGoalService.getGoals(spaceId, userId);

        // Recent 10 transactions
        var recent = transactionRepository.findRecentBySpace(spaceId, PageRequest.of(0, 10));
        var recentResponses = recent.stream()
                .map(TransactionServiceImpl::mapToResponseStatic)
                .toList();

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
        }).toList();
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
        }).toList();
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
