// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.request.BudgetRequest;
import com.example.bton.dto.response.BudgetOverviewResponse;
import com.example.bton.dto.response.BudgetResponse;
import com.example.bton.dto.response.BudgetStatusResponse;
import com.example.bton.entity.Budget;
import com.example.bton.entity.Category;
import com.example.bton.entity.FinancialSpace;
import com.example.bton.entity.User;
import com.example.bton.enums.SpaceType;
import com.example.bton.exception.DuplicateResourceException;
import com.example.bton.exception.ResourceNotFoundException;
import com.example.bton.repository.BudgetRepository;
import com.example.bton.repository.CategoryRepository;
import com.example.bton.repository.FinancialSpaceRepository;
import com.example.bton.repository.TransactionRepository;
import com.example.bton.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BudgetServiceImpl {

    private final BudgetRepository budgetRepository;
    private final FinancialSpaceRepository spaceRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final FinancialSpaceServiceImpl spaceService;

    public record MonthYear(int month, int year) {}

    public MonthYear parseMonthYear(String monthParam, int yearParam) {
        LocalDate now = LocalDate.now();
        if (monthParam == null || monthParam.isBlank()) {
            return new MonthYear(now.getMonthValue(), yearParam != 0 ? yearParam : now.getYear());
        }
        String trimmed = monthParam.trim();
        if (trimmed.contains("-")) {
            String[] parts = trimmed.split("-");
            try {
                int y = Integer.parseInt(parts[0].trim());
                int m = Integer.parseInt(parts[1].trim());
                return new MonthYear(m, y);
            } catch (NumberFormatException ignored) {
                // Fall through to single-month integer parser
            }
        }
        try {
            int m = Integer.parseInt(trimmed);
            return new MonthYear(m, yearParam != 0 ? yearParam : now.getYear());
        } catch (NumberFormatException e) {
            return new MonthYear(now.getMonthValue(), yearParam != 0 ? yearParam : now.getYear());
        }
    }

    public Long resolveSpaceId(Long spaceId, Long userId) {
        if (spaceId != null) {
            return spaceId;
        }
        return spaceRepository.findFirstByOwnerIdAndTypeAndIsActiveTrue(userId, SpaceType.PERSONAL)
                .map(FinancialSpace::getId)
                .orElseGet(() -> spaceRepository.findAccessibleSpaces(userId).stream()
                        .findFirst()
                        .map(FinancialSpace::getId)
                        .orElseThrow(() -> new ResourceNotFoundException("No accessible financial space found for user: " + userId)));
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> getBudgets(Long spaceId, Long userId, int month, int year) {
        Long resolvedSpaceId = resolveSpaceId(spaceId, userId);
        spaceService.verifySpaceAccess(resolvedSpaceId, userId);
        return budgetRepository.findBySpaceAndMonthWithCategory(resolvedSpaceId, month, year)
                .stream().map(b -> mapToResponse(b, resolvedSpaceId, month, year))
                .toList();
    }

    @Transactional(readOnly = true)
    public BudgetStatusResponse getBudgetStatus(Long spaceId, Long userId, int month, int year) {
        Long resolvedSpaceId = resolveSpaceId(spaceId, userId);
        spaceService.verifySpaceAccess(resolvedSpaceId, userId);
        List<BudgetResponse> budgets = getBudgets(resolvedSpaceId, userId, month, year);

        List<BudgetStatusResponse.BudgetStatusItem> items = budgets.stream().map(b ->
                BudgetStatusResponse.BudgetStatusItem.builder()
                        .id(b.getId())
                        .category(b.getCategory())
                        .limit(b.getAmount())
                        .spent(b.getSpent())
                        .percent(b.getUsagePercentage())
                        .status(b.getStatus())
                        .build()
        ).toList();

        return BudgetStatusResponse.builder()
                .budgetList(items)
                .build();
    }

    @Transactional(readOnly = true)
    public BudgetOverviewResponse getBudgetOverview(Long spaceId, Long userId, int month, int year) {
        Long resolvedSpaceId = resolveSpaceId(spaceId, userId);
        spaceService.verifySpaceAccess(resolvedSpaceId, userId);
        List<BudgetResponse> budgets = getBudgets(resolvedSpaceId, userId, month, year);

        BigDecimal totalBudget = BigDecimal.ZERO;
        BigDecimal totalSpent = BigDecimal.ZERO;
        int okCount = 0;
        int warningCount = 0;
        int exceededCount = 0;

        for (BudgetResponse b : budgets) {
            if (b.getAmount() != null) {
                totalBudget = totalBudget.add(b.getAmount());
            }
            if (b.getSpent() != null) {
                totalSpent = totalSpent.add(b.getSpent());
            }
            if ("EXCEEDED".equals(b.getStatus())) {
                exceededCount++;
            } else if ("WARNING".equals(b.getStatus())) {
                warningCount++;
            } else {
                okCount++;
            }
        }

        BigDecimal remainingAmount = totalBudget.subtract(totalSpent);
        BigDecimal remainingPercentage = totalBudget.compareTo(BigDecimal.ZERO) > 0
                ? remainingAmount.multiply(new BigDecimal("100")).divide(totalBudget, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal usagePercentage = totalBudget.compareTo(BigDecimal.ZERO) > 0
                ? totalSpent.multiply(new BigDecimal("100")).divide(totalBudget, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return BudgetOverviewResponse.builder()
                .month(month)
                .year(year)
                .monthFormatted(String.format("%04d-%02d", year, month))
                .totalBudget(totalBudget)
                .totalSpent(totalSpent)
                .remainingAmount(remainingAmount)
                .remainingPercentage(remainingPercentage)
                .usagePercentage(usagePercentage)
                .totalBudgets(budgets.size())
                .okCount(okCount)
                .warningCount(warningCount)
                .exceededCount(exceededCount)
                .build();
    }

    @Transactional
    public BudgetResponse createBudget(Long userId, BudgetRequest request) {
        Long spaceId = resolveSpaceId(request.getSpaceId(), userId);
        spaceService.verifySpaceAccess(spaceId, userId);

        Integer month = request.getMonth();
        Integer year = request.getYear();
        if (month == null || year == null) {
            LocalDate now = LocalDate.now();
            month = month != null ? month : now.getMonthValue();
            year = year != null ? year : now.getYear();
        }

        if (budgetRepository.existsBySpaceIdAndCategoryIdAndBudgetMonthAndBudgetYear(
                spaceId, request.getCategoryId(), month, year)) {
            throw new DuplicateResourceException(
                    "Budget already exists for this category in the selected month/year");
        }

        FinancialSpace space = spaceRepository.findByIdAndIsActiveTrue(spaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Financial space", "id", spaceId));
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        BigDecimal amount = request.getEffectiveAmount();

        Budget budget = Budget.builder()
                .space(space)
                .user(user)
                .category(category)
                .amount(amount)
                .budgetMonth(month)
                .budgetYear(year)
                .warningThreshold(request.getWarningThreshold() != null
                        ? request.getWarningThreshold() : new BigDecimal("80.00"))
                .build();

        return mapToResponse(budgetRepository.save(budget),
                spaceId, month, year);
    }

    @Transactional
    public BudgetResponse updateBudget(Long budgetId, Long userId, BudgetRequest request) {
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget", "id", budgetId));
        spaceService.verifySpaceAccess(budget.getSpace().getId(), userId);

        if (request.getEffectiveAmount() != null) {
            budget.setAmount(request.getEffectiveAmount());
        }
        if (request.getWarningThreshold() != null) {
            budget.setWarningThreshold(request.getWarningThreshold());
        }

        budget = budgetRepository.save(budget);
        return mapToResponse(budget, budget.getSpace().getId(), budget.getBudgetMonth(), budget.getBudgetYear());
    }

    @Transactional
    public void deleteBudget(Long budgetId, Long userId) {
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget", "id", budgetId));
        spaceService.verifySpaceAccess(budget.getSpace().getId(), userId);
        budgetRepository.delete(budget);
    }

    public BudgetResponse mapToResponse(Budget budget, Long spaceId, int month, int year) {
        BigDecimal spent = transactionRepository.sumExpenseBySpaceCategoryAndMonth(
                spaceId, budget.getCategory().getId(), year, month);
        if (spent == null) spent = BigDecimal.ZERO;

        BigDecimal budgetAmount = budget.getAmount();
        BigDecimal remaining = budgetAmount.subtract(spent);

        BigDecimal usagePercentage = budgetAmount.compareTo(BigDecimal.ZERO) > 0
                ? spent.multiply(new BigDecimal("100")).divide(budgetAmount, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        String status;
        if (usagePercentage.compareTo(new BigDecimal("100")) >= 0) {
            status = "EXCEEDED";
        } else if (usagePercentage.compareTo(budget.getWarningThreshold()) >= 0) {
            status = "WARNING";
        } else {
            status = "OK";
        }

        return BudgetResponse.builder()
                .id(budget.getId())
                .spaceId(spaceId)
                .userId(budget.getUser() != null ? budget.getUser().getId() : null)
                .categoryId(budget.getCategory() != null ? budget.getCategory().getId() : null)
                .category(CategoryServiceImpl.mapCategoryStatic(budget.getCategory()))
                .amount(budgetAmount)
                .limitAmount(budgetAmount)
                .month(month)
                .year(year)
                .monthFormatted(String.format("%04d-%02d", year, month))
                .warningThreshold(budget.getWarningThreshold())
                .spent(spent)
                .totalSpent(spent)
                .remaining(remaining)
                .usagePercentage(usagePercentage)
                .status(status)
                .build();
    }
}
