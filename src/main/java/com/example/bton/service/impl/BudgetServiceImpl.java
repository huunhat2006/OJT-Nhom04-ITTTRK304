// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.request.BudgetRequest;
import com.example.bton.dto.response.BudgetResponse;
import com.example.bton.entity.Budget;
import com.example.bton.entity.Category;
import com.example.bton.entity.FinancialSpace;
import com.example.bton.entity.User;
import com.example.bton.enums.TransactionType;
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
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetServiceImpl {

    private final BudgetRepository budgetRepository;
    private final FinancialSpaceRepository spaceRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final FinancialSpaceServiceImpl spaceService;

    @Transactional(readOnly = true)
    public List<BudgetResponse> getBudgets(Long spaceId, Long userId, int month, int year) {
        spaceService.verifySpaceAccess(spaceId, userId);
        return budgetRepository.findBySpaceAndMonthWithCategory(spaceId, month, year)
                .stream().map(b -> mapToResponse(b, spaceId, month, year))
                .collect(Collectors.toList());
    }

    @Transactional
    public BudgetResponse createBudget(Long userId, BudgetRequest request) {
        spaceService.verifySpaceAccess(request.getSpaceId(), userId);

        if (budgetRepository.existsBySpaceIdAndCategoryIdAndBudgetMonthAndBudgetYear(
                request.getSpaceId(), request.getCategoryId(), request.getMonth(), request.getYear())) {
            throw new DuplicateResourceException(
                    "Budget already exists for this category in the selected month/year");
        }

        FinancialSpace space = spaceRepository.findByIdAndIsActiveTrue(request.getSpaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Financial space", "id", request.getSpaceId()));
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Budget budget = Budget.builder()
                .space(space)
                .user(user)
                .category(category)
                .amount(request.getAmount())
                .budgetMonth(request.getMonth())
                .budgetYear(request.getYear())
                .warningThreshold(request.getWarningThreshold() != null
                        ? request.getWarningThreshold() : new BigDecimal("80.00"))
                .build();

        return mapToResponse(budgetRepository.save(budget),
                request.getSpaceId(), request.getMonth(), request.getYear());
    }

    @Transactional
    public BudgetResponse updateBudget(Long budgetId, Long userId, BudgetRequest request) {
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new ResourceNotFoundException("Budget", "id", budgetId));
        spaceService.verifySpaceAccess(budget.getSpace().getId(), userId);

        budget.setAmount(request.getAmount());
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
            status = "NORMAL";
        }

        return BudgetResponse.builder()
                .id(budget.getId())
                .spaceId(spaceId)
                .category(CategoryServiceImpl.mapCategoryStatic(budget.getCategory()))
                .amount(budgetAmount)
                .month(month)
                .year(year)
                .warningThreshold(budget.getWarningThreshold())
                .spent(spent)
                .remaining(remaining)
                .usagePercentage(usagePercentage)
                .status(status)
                .build();
    }
}
