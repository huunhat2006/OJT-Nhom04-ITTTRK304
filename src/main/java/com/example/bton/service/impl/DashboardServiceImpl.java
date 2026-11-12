// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.response.DashboardSummaryResponse;
import com.example.bton.dto.response.TopExpenseCategoryResponse;
import com.example.bton.entity.FinancialSpace;
import com.example.bton.enums.SpaceType;
import com.example.bton.enums.TransactionType;
import com.example.bton.repository.FinancialSpaceRepository;
import com.example.bton.repository.TransactionRepository;
import com.example.bton.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardServiceImpl implements DashboardService {

    private final TransactionRepository transactionRepository;
    private final FinancialSpaceRepository spaceRepository;
    private final FinancialSpaceServiceImpl spaceService;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "dashboardSummary", key = "(#spaceId != null ? #spaceId.toString() : 'default') + '_' + #userId + '_' + #year + '_' + #month")
    public DashboardSummaryResponse getSummary(Long spaceId, Long userId, Integer month, Integer year) {
        int targetMonth = (month != null && month >= 1 && month <= 12) ? month : LocalDate.now().getMonthValue();
        int targetYear = (year != null && year > 0) ? year : LocalDate.now().getYear();

        Long targetSpaceId = resolveSpaceId(spaceId, userId);
        if (targetSpaceId != null) {
            spaceService.verifySpaceAccess(targetSpaceId, userId);
        }

        // 1. Current month income & expense
        BigDecimal totalIncome = transactionRepository
                .sumBySpaceOrUserAndTypeAndMonth(targetSpaceId, (targetSpaceId == null ? userId : null), TransactionType.INCOME, targetYear, targetMonth);
        if (totalIncome == null) totalIncome = BigDecimal.ZERO;

        BigDecimal totalExpense = transactionRepository
                .sumBySpaceOrUserAndTypeAndMonth(targetSpaceId, (targetSpaceId == null ? userId : null), TransactionType.EXPENSE, targetYear, targetMonth);
        if (totalExpense == null) totalExpense = BigDecimal.ZERO;

        BigDecimal balance = totalIncome.subtract(totalExpense);

        // 2. Savings rate: ((totalIncome - totalExpense) / totalIncome) * 100
        BigDecimal savingsRate = BigDecimal.ZERO;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            savingsRate = balance.divide(totalIncome, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        // 3. Previous month expense to calculate changeFromLastMonth
        int prevMonth = (targetMonth == 1) ? 12 : targetMonth - 1;
        int prevYear = (targetMonth == 1) ? targetYear - 1 : targetYear;

        BigDecimal prevExpense = transactionRepository
                .sumBySpaceOrUserAndTypeAndMonth(targetSpaceId, (targetSpaceId == null ? userId : null), TransactionType.EXPENSE, prevYear, prevMonth);
        if (prevExpense == null) prevExpense = BigDecimal.ZERO;

        BigDecimal changeFromLastMonth = BigDecimal.ZERO;
        if (prevExpense.compareTo(BigDecimal.ZERO) > 0) {
            changeFromLastMonth = totalExpense.subtract(prevExpense)
                    .divide(prevExpense, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        log.debug("Dashboard summary for user {} in space {}: income={}, expense={}, balance={}",
                userId, targetSpaceId, totalIncome, totalExpense, balance);

        return DashboardSummaryResponse.builder()
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .balance(balance)
                .savingsRate(savingsRate)
                .changeFromLastMonth(changeFromLastMonth)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TopExpenseCategoryResponse> getTopExpenses(Long spaceId, Long userId, Integer month, Integer year) {
        int targetMonth = (month != null && month >= 1 && month <= 12) ? month : LocalDate.now().getMonthValue();
        int targetYear = (year != null && year > 0) ? year : LocalDate.now().getYear();

        Long targetSpaceId = resolveSpaceId(spaceId, userId);
        if (targetSpaceId != null) {
            spaceService.verifySpaceAccess(targetSpaceId, userId);
        }

        BigDecimal totalExpense = transactionRepository
                .sumBySpaceOrUserAndTypeAndMonth(targetSpaceId, (targetSpaceId == null ? userId : null), TransactionType.EXPENSE, targetYear, targetMonth);
        if (totalExpense == null) totalExpense = BigDecimal.ZERO;

        List<Object[]> rawList = transactionRepository.findTopExpensesByCategory(
                targetSpaceId, (targetSpaceId == null ? userId : null), targetYear, targetMonth, PageRequest.of(0, 5));

        List<TopExpenseCategoryResponse> result = new ArrayList<>();
        for (Object[] row : rawList) {
            result.add(mapToTopExpenseCategory(row, totalExpense));
        }

        return result;
    }

    private TopExpenseCategoryResponse mapToTopExpenseCategory(Object[] row, BigDecimal totalExpense) {
        Long catId = (row[0] != null) ? ((Number) row[0]).longValue() : null;
        String catName = (row[1] != null) ? row[1].toString() : "Khác";
        String catNameVi = (row[2] != null) ? row[2].toString() : catName;
        String color = (row[3] != null) ? row[3].toString() : "#6B7280";
        String icon = (row[4] != null) ? row[4].toString() : "more";
        BigDecimal amount = (row[5] != null) ? (BigDecimal) row[5] : BigDecimal.ZERO;

        BigDecimal percentage = BigDecimal.ZERO;
        if (totalExpense.compareTo(BigDecimal.ZERO) > 0) {
            percentage = amount.divide(totalExpense, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return TopExpenseCategoryResponse.builder()
                .categoryId(catId)
                .categoryName(catName)
                .categoryNameVi(catNameVi)
                .icon(icon)
                .color(color)
                .totalAmount(amount)
                .percentage(percentage)
                .build();
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
