// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.request.TransactionRequest;
import com.example.bton.dto.response.PageResponse;
import com.example.bton.dto.response.TransactionResponse;
import com.example.bton.entity.*;
import com.example.bton.enums.TransactionType;
import com.example.bton.enums.WalletType;
import com.example.bton.exception.AccessDeniedException;
import com.example.bton.exception.BadRequestException;
import com.example.bton.exception.ResourceNotFoundException;
import com.example.bton.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl {

    private final TransactionRepository transactionRepository;
    private final FinancialSpaceRepository spaceRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final BudgetRepository budgetRepository;
    private final FinancialSpaceServiceImpl spaceService;
    private final NotificationServiceImpl notificationService;
    private final FamilyMemberRepository familyMemberRepository;

    @Transactional
    public TransactionResponse createTransaction(Long userId, TransactionRequest request) {
        spaceService.verifySpaceAccess(request.getSpaceId(), userId);

        FinancialSpace space = spaceRepository.findByIdAndIsActiveTrue(request.getSpaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Financial space", "id", request.getSpaceId()));

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Use specified wallet or find default wallet for this space/user
        Wallet wallet;
        if (request.getWalletId() != null) {
            wallet = walletRepository.findById(request.getWalletId())
                    .orElseThrow(() -> new ResourceNotFoundException("Wallet", "id", request.getWalletId()));
            if (!wallet.getUser().getId().equals(userId)) {
                throw new AccessDeniedException("You don't own this wallet");
            }
        } else {
            wallet = walletRepository.findBySpaceIdAndUserId(request.getSpaceId(), userId)
                    .orElseGet(() -> {
                        Wallet newWallet = Wallet.builder()
                                .space(space)
                                .user(user)
                                .name("Tiền mặt")
                                .walletType(WalletType.CASH)
                                .currency("VND")
                                .build();
                        return walletRepository.save(newWallet);
                    });
        }

        BigDecimal amount = request.getAmount();

        // Check sufficient balance for expense
        if (request.getType() == TransactionType.EXPENSE && wallet.getBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Số dư ví không đủ để thực hiện khoản chi này (FIN-NB07)");
        }

        Transaction transaction = Transaction.builder()
                .space(space)
                .user(user)
                .category(category)
                .type(request.getType())
                .amount(amount)
                .description(request.getDescription())
                .transactionDate(request.getTransactionDate())
                .note(request.getNote())
                .receiptUrl(request.getReceiptUrl())
                .wallet(wallet)
                .destinationWallet(request.getDestinationWalletId() != null
                        ? walletRepository.findById(request.getDestinationWalletId())
                                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "id", request.getDestinationWalletId()))
                        : null)
                .isDeleted(false)
                .build();

        // Update wallet balance based on transaction type
        if (request.getType() == TransactionType.EXPENSE) {
            wallet.setBalance(wallet.getBalance().subtract(amount));
        } else if (request.getType() == TransactionType.INCOME) {
            wallet.setBalance(wallet.getBalance().add(amount));
        }
        // For TRANSFER, balance is handled by WalletService

        transaction = transactionRepository.save(transaction);
        walletRepository.save(wallet);

        // Check budget thresholds for expenses (based on the transaction's own date)
        if (request.getType() == TransactionType.EXPENSE) {
            checkBudgetThresholds(space, category, amount, userId, request.getTransactionDate());
        }

        return mapToResponse(transaction);
    }

    @Transactional(readOnly = true)
    public PageResponse<TransactionResponse> getTransactions(
            Long spaceId, Long userId, TransactionType type,
            Long categoryId, Long walletId, LocalDate startDate, LocalDate endDate,
            String keyword, int page, int size) {

        spaceService.verifySpaceAccess(spaceId, userId);

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "transactionDate", "createdAt"));

        Page<Transaction> transactionPage = transactionRepository.findBySpaceWithFilters(
                spaceId, type, categoryId, walletId, startDate, endDate, keyword, pageable);

        return PageResponse.<TransactionResponse>builder()
                .content(transactionPage.getContent().stream()
                        .map(this::mapToResponse).collect(Collectors.toList()))
                .pageNumber(transactionPage.getNumber())
                .pageSize(transactionPage.getSize())
                .totalElements(transactionPage.getTotalElements())
                .totalPages(transactionPage.getTotalPages())
                .first(transactionPage.isFirst())
                .last(transactionPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(Long transactionId, Long userId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));

        spaceService.verifySpaceAccess(transaction.getSpace().getId(), userId);
        return mapToResponse(transaction);
    }

    @Transactional
    public TransactionResponse updateTransaction(Long transactionId, Long userId, TransactionRequest request) {
        Transaction existingTransaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));

        spaceService.verifySpaceAccess(existingTransaction.getSpace().getId(), userId);
        verifyTransactionModifyAccess(existingTransaction, userId);

        // Revert old balance change
        revertBalance(existingTransaction);

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        existingTransaction.setCategory(category);
        existingTransaction.setType(request.getType());
        existingTransaction.setAmount(request.getAmount());
        existingTransaction.setDescription(request.getDescription());
        existingTransaction.setTransactionDate(request.getTransactionDate());
        existingTransaction.setNote(request.getNote());
        existingTransaction.setReceiptUrl(request.getReceiptUrl());

        // Update wallet reference if changed
        if (request.getWalletId() != null) {
            Wallet newWallet = walletRepository.findById(request.getWalletId())
                    .orElseThrow(() -> new ResourceNotFoundException("Wallet", "id", request.getWalletId()));
            existingTransaction.setWallet(newWallet);
        }

        // Apply new balance change
        BigDecimal amount = request.getAmount();
        Wallet wallet = existingTransaction.getWallet();
        if (request.getType() == TransactionType.EXPENSE) {
            if (wallet.getBalance().compareTo(amount) < 0) {
                throw new BadRequestException("Số dư ví không đủ để thực hiện khoản chi này");
            }
            wallet.setBalance(wallet.getBalance().subtract(amount));
        } else if (request.getType() == TransactionType.INCOME) {
            wallet.setBalance(wallet.getBalance().add(amount));
        }

        Budget budget = budgetRepository.findBySpaceIdAndCategoryIdAndBudgetMonthAndBudgetYear(
                existingTransaction.getSpace().getId(), request.getCategoryId(),
                request.getTransactionDate().getMonthValue(),
                request.getTransactionDate().getYear())
                .orElse(null);

        if (budget != null && request.getType() == TransactionType.EXPENSE) {
            checkBudgetThresholds(existingTransaction.getSpace(), category, amount, userId,
                    request.getTransactionDate());
        }

        existingTransaction = transactionRepository.save(existingTransaction);
        walletRepository.save(wallet);

        return mapToResponse(existingTransaction);
    }

    @Transactional
    public void deleteTransaction(Long transactionId, Long userId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", transactionId));

        spaceService.verifySpaceAccess(transaction.getSpace().getId(), userId);
        verifyTransactionModifyAccess(transaction, userId);

        revertBalance(transaction);

        // Soft delete to keep accounting history (SRS 2.4)
        transaction.setIsDeleted(true);
        transactionRepository.save(transaction);
    }

    /**
     * UC10: In a family space, members may only edit/delete their own transactions.
     * The family owner (and space admins) can manage every transaction in the space.
     */
    private void verifyTransactionModifyAccess(Transaction transaction, Long userId) {
        if (transaction.getUser().getId().equals(userId)) {
            return;
        }
        boolean isSpaceOwner = transaction.getSpace().getOwner().getId().equals(userId);
        boolean isSpaceAdmin = familyMemberRepository
                .findRoleBySpaceIdAndUserId(transaction.getSpace().getId(), userId)
                .map(role -> role == com.example.bton.enums.FamilyRole.OWNER
                        || role == com.example.bton.enums.FamilyRole.ADMIN)
                .orElse(false);
        if (!isSpaceOwner && !isSpaceAdmin) {
            throw new AccessDeniedException("Bạn chỉ có thể chỉnh sửa/xóa giao dịch do chính mình tạo ra");
        }
    }

    private void revertBalance(Transaction transaction) {
        if (transaction.getType() == TransactionType.EXPENSE) {
            Wallet wallet = transaction.getWallet();
            if (wallet != null) {
                wallet.setBalance(wallet.getBalance().add(transaction.getAmount()));
            }
        } else if (transaction.getType() == TransactionType.INCOME) {
            Wallet wallet = transaction.getWallet();
            if (wallet != null) {
                wallet.setBalance(wallet.getBalance().subtract(transaction.getAmount()));
            }
        }
        Wallet wallet = transaction.getWallet();
        if (wallet != null) {
            walletRepository.save(wallet);
        }
    }

    private void checkBudgetThresholds(FinancialSpace space, Category category, BigDecimal amount,
                                       Long userId, LocalDate transactionDate) {
        LocalDate date = transactionDate != null ? transactionDate : LocalDate.now();
        Budget budget = budgetRepository.findBySpaceIdAndCategoryIdAndBudgetMonthAndBudgetYear(
                space.getId(), category.getId(), date.getMonthValue(), date.getYear())
                .orElse(null);

        if (budget != null) {
            BigDecimal spent = transactionRepository.sumExpenseBySpaceCategoryAndMonth(
                    space.getId(), category.getId(), date.getYear(), date.getMonthValue());
            if (spent == null) spent = BigDecimal.ZERO;

            BigDecimal usagePercentage = budget.getAmount().compareTo(BigDecimal.ZERO) > 0
                    ? spent.multiply(new BigDecimal("100")).divide(budget.getAmount(), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            if (usagePercentage.compareTo(new BigDecimal("100")) >= 0) {
                notificationService.createNotification(
                        userId,
                        "Cảnh báo bội chi",
                        "Bạn đã vượt quá hạn mức ngân sách '" + category.getName() + "' " +
                                spent.subtract(budget.getAmount()) + " VNĐ!",
                        com.example.bton.enums.NotificationType.BUDGET_EXCEEDED,
                        budget.getId());
            } else if (usagePercentage.compareTo(budget.getWarningThreshold()) >= 0) {
                notificationService.createNotification(
                        userId,
                        "Cảnh báo ngân sách",
                        "Danh mục '" + category.getName() + "' đã chi tiêu đạt " +
                                usagePercentage + "% hạn mức ngân sách tháng.",
                        com.example.bton.enums.NotificationType.BUDGET_WARNING,
                        budget.getId());
            }
        }
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getRecentTransactions(Long spaceId, Long userId, int limit) {
        spaceService.verifySpaceAccess(spaceId, userId);
        Pageable pageable = PageRequest.of(0, limit);
        return transactionRepository.findRecentBySpace(spaceId, pageable)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public TransactionResponse mapToResponse(Transaction t) {
        return mapToResponseStatic(t);
    }

    public static TransactionResponse mapToResponseStatic(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .spaceId(t.getSpace().getId())
                .spaceName(t.getSpace().getName())
                .userId(t.getUser().getId())
                .userName(t.getUser().getFullName())
                .category(t.getCategory() != null
                        ? CategoryServiceImpl.mapCategoryStatic(t.getCategory())
                        : null)
                .type(t.getType())
                .amount(t.getAmount())
                .description(t.getDescription())
                .transactionDate(t.getTransactionDate())
                .note(t.getNote())
                .receiptUrl(t.getReceiptUrl())
                .walletName(t.getWallet() != null ? t.getWallet().getName() : null)
                .walletType(t.getWallet() != null ? t.getWallet().getWalletType().name() : null)
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
