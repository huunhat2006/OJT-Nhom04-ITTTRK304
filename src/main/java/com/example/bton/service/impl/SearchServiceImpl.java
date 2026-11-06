// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.response.CategoryResponse;
import com.example.bton.dto.response.GlobalSearchResponse;
import com.example.bton.dto.response.SavingsGoalResponse;
import com.example.bton.dto.response.TransactionResponse;
import com.example.bton.entity.FinancialSpace;
import com.example.bton.enums.SpaceType;
import com.example.bton.repository.CategoryRepository;
import com.example.bton.repository.FinancialSpaceRepository;
import com.example.bton.repository.SavingsGoalRepository;
import com.example.bton.repository.TransactionRepository;
import com.example.bton.service.SearchService;
import com.example.bton.specification.TransactionSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final SavingsGoalRepository savingsGoalRepository;
    private final FinancialSpaceRepository spaceRepository;
    private final FinancialSpaceServiceImpl spaceService;
    private final SavingsGoalServiceImpl savingsGoalService;

    @Override
    @Transactional(readOnly = true)
    public GlobalSearchResponse globalSearch(Long spaceId, Long userId, String query) {
        String cleanQuery = (query != null) ? query.trim() : "";

        // Resolve active space
        Long resolvedSpaceId = spaceId;
        if (resolvedSpaceId != null) {
            spaceService.verifySpaceAccess(resolvedSpaceId, userId);
        } else {
            resolvedSpaceId = spaceRepository.findFirstByOwnerIdAndTypeAndIsActiveTrue(userId, SpaceType.PERSONAL)
                    .map(FinancialSpace::getId)
                    .orElse(null);
        }

        // 1. Search matching transactions (Limit top 10)
        List<TransactionResponse> transactions = Collections.emptyList();
        if (!cleanQuery.isEmpty()) {
            transactions = transactionRepository.findAll(
                            TransactionSpecification.search(resolvedSpaceId, userId, cleanQuery),
                            PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "transactionDate", "createdAt")))
                    .getContent()
                    .stream()
                    .map(TransactionServiceImpl::mapToResponseStatic)
                    .collect(Collectors.toList());
        }

        // 2. Search matching categories (System + Personal, Limit top 10)
        List<CategoryResponse> categories = Collections.emptyList();
        if (!cleanQuery.isEmpty()) {
            categories = categoryRepository.searchAvailableForUser(userId, cleanQuery)
                    .stream()
                    .limit(10)
                    .map(CategoryServiceImpl::mapCategoryStatic)
                    .collect(Collectors.toList());
        }

        // 3. Search matching savings goals in this space (Limit top 10)
        List<SavingsGoalResponse> savingsGoals = Collections.emptyList();
        if (resolvedSpaceId != null && !cleanQuery.isEmpty()) {
            savingsGoals = savingsGoalRepository.searchBySpaceAndKeyword(resolvedSpaceId, cleanQuery)
                    .stream()
                    .limit(10)
                    .map(savingsGoalService::mapToResponse)
                    .collect(Collectors.toList());
        }

        return GlobalSearchResponse.builder()
                .query(cleanQuery)
                .transactions(transactions)
                .categories(categories)
                .savingsGoals(savingsGoals)
                .build();
    }
}
