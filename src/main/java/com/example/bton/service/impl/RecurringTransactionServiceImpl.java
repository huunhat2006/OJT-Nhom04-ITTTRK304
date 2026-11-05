package com.example.bton.service.impl;

import com.example.bton.dto.request.RecurringTransactionRequest;
import com.example.bton.dto.request.TransactionRequest;
import com.example.bton.dto.response.PageResponse;
import com.example.bton.dto.response.RecurringTransactionResponse;
import com.example.bton.dto.response.RecurringTransactionRunResponse;
import com.example.bton.dto.response.TransactionResponse;
import com.example.bton.entity.Category;
import com.example.bton.entity.FinancialSpace;
import com.example.bton.entity.RecurringTransaction;
import com.example.bton.entity.RecurringTransactionRun;
import com.example.bton.entity.Transaction;
import com.example.bton.entity.User;
import com.example.bton.entity.Wallet;
import com.example.bton.enums.CategoryType;
import com.example.bton.enums.FamilyRole;
import com.example.bton.enums.RecurringFrequency;
import com.example.bton.enums.RecurringRunStatus;
import com.example.bton.enums.RecurringStatus;
import com.example.bton.enums.TransactionType;
import com.example.bton.exception.AccessDeniedException;
import com.example.bton.exception.BadRequestException;
import com.example.bton.exception.DuplicateResourceException;
import com.example.bton.exception.ResourceNotFoundException;
import com.example.bton.repository.CategoryRepository;
import com.example.bton.repository.FamilyMemberRepository;
import com.example.bton.repository.FinancialSpaceRepository;
import com.example.bton.repository.RecurringTransactionRepository;
import com.example.bton.repository.RecurringTransactionRunRepository;
import com.example.bton.repository.TransactionRepository;
import com.example.bton.repository.UserRepository;
import com.example.bton.repository.WalletRepository;
import com.example.bton.service.RecurringTransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecurringTransactionServiceImpl implements RecurringTransactionService {

    private static final DateTimeFormatter LOCAL_DATE_TIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final RecurringTransactionRepository recurringRepository;
    private final RecurringTransactionRunRepository runRepository;
    private final TransactionRepository transactionRepository;
    private final FinancialSpaceRepository spaceRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final FinancialSpaceServiceImpl spaceService;
    private final TransactionServiceImpl transactionService;

    @Override
    @Transactional(readOnly = true)
    public List<RecurringTransactionResponse> getRecurringTransactions(Long userId, Long spaceId) {
        List<RecurringTransaction> recurringTransactions;
        if (spaceId != null) {
            spaceService.verifySpaceAccess(spaceId, userId);
            recurringTransactions = recurringRepository.findBySpaceIdOrderByCreatedAtDesc(spaceId);
        } else {
            recurringTransactions = recurringRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        return recurringTransactions.stream().map(this::mapToResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RecurringTransactionResponse getRecurringTransaction(Long id, Long userId) {
        RecurringTransaction recurring = loadDetailed(id);
        spaceService.verifySpaceAccess(recurring.getSpace().getId(), userId);
        return mapToResponse(recurring);
    }

    @Override
    @Transactional
    public RecurringTransactionResponse createRecurringTransaction(Long userId,
                                                                   RecurringTransactionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        FinancialSpace space = spaceRepository.findByIdAndIsActiveTrue(request.getSpaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Financial space", "id", request.getSpaceId()));
        spaceService.verifySpaceAccess(space.getId(), userId);

        Transaction template = loadTemplate(request.getTemplateTransactionId(), space.getId(), userId);
        TransactionType type = request.getType() != null
                ? request.getType()
                : (template != null ? template.getType() : null);
        Category category = resolveCategory(request.getCategoryId(), template);
        BigDecimal amount = request.getAmount() != null
                ? request.getAmount()
                : (template != null ? template.getAmount() : null);
        Wallet wallet = resolveWallet(request.getWalletId(), template, userId);
        String description = request.getDescription() != null
                ? request.getDescription()
                : (template != null ? template.getDescription() : null);

        validateFields(type, category, amount, userId);
        validateDates(request.getStartDate(), request.getEndDate(), request.getNextRunDate());

        LocalDate nextRunDate = request.getNextRunDate() != null
                ? request.getNextRunDate()
                : request.getStartDate();

        RecurringTransaction recurring = RecurringTransaction.builder()
                .user(user)
                .space(space)
                .templateTransaction(template)
                .wallet(wallet)
                .category(category)
                .type(type)
                .amount(amount)
                .description(description)
                .frequency(request.getFrequency() != null ? request.getFrequency() : RecurringFrequency.MONTHLY)
                .intervalCount(request.getIntervalCount() != null ? request.getIntervalCount() : 1)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .nextRunDate(nextRunDate)
                .status(RecurringStatus.ACTIVE)
                .isActive(true)
                .build();

        try {
            recurring = recurringRepository.saveAndFlush(recurring);
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateResourceException(
                    "A recurring transaction with the same template already exists in this space");
        }
        return mapToResponse(recurring);
    }

    @Override
    @Transactional
    public RecurringTransactionResponse updateRecurringTransaction(Long id, Long userId,
                                                                   RecurringTransactionRequest request) {
        RecurringTransaction recurring = loadDetailed(id);
        verifyModifyAccess(recurring, userId);

        FinancialSpace space = spaceRepository.findByIdAndIsActiveTrue(request.getSpaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Financial space", "id", request.getSpaceId()));
        spaceService.verifySpaceAccess(space.getId(), userId);

        Transaction template = request.getTemplateTransactionId() != null
                ? loadTemplate(request.getTemplateTransactionId(), space.getId(), userId)
                : null;

        TransactionType type = request.getType() != null
                ? request.getType()
                : (template != null ? template.getType() : recurring.getType());
        Category category = request.getCategoryId() != null
                ? categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()))
                : (template != null && template.getCategory() != null
                    ? template.getCategory()
                    : recurring.getCategory());
        BigDecimal amount = request.getAmount() != null
                ? request.getAmount()
                : (template != null ? template.getAmount() : recurring.getAmount());
        Wallet wallet = request.getWalletId() != null
                ? loadWallet(request.getWalletId(), userId)
                : (template != null ? template.getWallet() : recurring.getWallet());
        String description = request.getDescription() != null
                ? request.getDescription()
                : (template != null ? template.getDescription() : recurring.getDescription());
        RecurringFrequency frequency = request.getFrequency() != null
                ? request.getFrequency()
                : recurring.getFrequency();
        Integer intervalCount = request.getIntervalCount() != null
                ? request.getIntervalCount()
                : recurring.getIntervalCount();

        validateFields(type, category, amount, userId);
        validateDates(request.getStartDate(), request.getEndDate(), request.getNextRunDate());

        LocalDate nextRunDate = request.getNextRunDate() != null
                ? request.getNextRunDate()
                : recurring.getNextRunDate();
        if (nextRunDate == null
                || !request.getStartDate().equals(recurring.getStartDate())
                || !frequency.equals(recurring.getFrequency())) {
            nextRunDate = request.getStartDate();
        }

        recurring.setSpace(space);
        if (template != null) {
            recurring.setTemplateTransaction(template);
        }
        recurring.setWallet(wallet);
        recurring.setCategory(category);
        recurring.setType(type);
        recurring.setAmount(amount);
        recurring.setDescription(description);
        recurring.setFrequency(frequency);
        recurring.setIntervalCount(intervalCount);
        recurring.setStartDate(request.getStartDate());
        recurring.setEndDate(request.getEndDate());
        recurring.setNextRunDate(nextRunDate);

        try {
            recurring = recurringRepository.saveAndFlush(recurring);
        } catch (DataIntegrityViolationException e) {
            throw new DuplicateResourceException(
                    "A recurring transaction with the same template already exists in this space");
        }
        return mapToResponse(recurring);
    }

    @Override
    @Transactional
    public void deleteRecurringTransaction(Long id, Long userId) {
        RecurringTransaction recurring = loadDetailed(id);
        verifyModifyAccess(recurring, userId);
        transactionRepository.clearRecurringLink(id);
        runRepository.deleteByRecurringTransactionId(id);
        recurringRepository.delete(recurring);
    }

    @Override
    @Transactional
    public RecurringTransactionResponse pauseRecurringTransaction(Long id, Long userId) {
        RecurringTransaction recurring = loadDetailed(id);
        verifyModifyAccess(recurring, userId);
        if (recurring.getStatus() == RecurringStatus.ENDED) {
            throw new BadRequestException("Giao dịch định kỳ đã kết thúc, không thể tạm dừng");
        }
        recurring.setStatus(RecurringStatus.PAUSED);
        recurring.setIsActive(false);
        return mapToResponse(recurringRepository.save(recurring));
    }

    @Override
    @Transactional
    public RecurringTransactionResponse resumeRecurringTransaction(Long id, Long userId) {
        RecurringTransaction recurring = loadDetailed(id);
        verifyModifyAccess(recurring, userId);
        if (recurring.getStatus() == RecurringStatus.ENDED) {
            throw new BadRequestException("Giao dịch định kỳ đã kết thúc, hãy cập nhật ngày kết thúc trước khi tiếp tục");
        }
        if (recurring.getNextRunDate() == null) {
            recurring.setNextRunDate(recurring.getStartDate());
        }
        recurring.setStatus(RecurringStatus.ACTIVE);
        recurring.setIsActive(true);
        return mapToResponse(recurringRepository.save(recurring));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<RecurringTransactionRunResponse> getHistory(Long id, Long userId,
                                                                    int page, int size) {
        RecurringTransaction recurring = loadDetailed(id);
        spaceService.verifySpaceAccess(recurring.getSpace().getId(), userId);

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(safePage, safeSize);
        Page<RecurringTransactionRun> runs = runRepository
                .findByRecurringTransactionIdOrderByExecutedAtDesc(id, pageable);
        ZoneId zone = resolveZone(recurring.getUser().getTimezone());

        return PageResponse.<RecurringTransactionRunResponse>builder()
                .content(runs.getContent().stream().map(run -> mapRun(run, zone)).toList())
                .pageNumber(runs.getNumber())
                .pageSize(runs.getSize())
                .totalElements(runs.getTotalElements())
                .totalPages(runs.getTotalPages())
                .first(runs.isFirst())
                .last(runs.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Long> findDueRecurringIds() {
        LocalDate maxDate = LocalDate.now(ZoneOffset.UTC).plusDays(2);
        return recurringRepository.findDue(RecurringStatus.ACTIVE, maxDate)
                .stream()
                .map(RecurringTransaction::getId)
                .toList();
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean executeDueRecurring(Long id) {
        RecurringTransaction recurring = recurringRepository.findDetailedById(id).orElse(null);
        if (recurring == null || recurring.getStatus() != RecurringStatus.ACTIVE) {
            return false;
        }

        LocalDate scheduledDate = recurring.getNextRunDate();
        if (scheduledDate == null) {
            recurring.setNextRunDate(recurring.getStartDate());
            recurringRepository.save(recurring);
            return false;
        }

        ZoneId zone = resolveZone(recurring.getUser().getTimezone());
        LocalDate today = LocalDate.now(zone);
        if (scheduledDate.isAfter(today)) {
            return false;
        }

        if (recurring.getEndDate() != null && scheduledDate.isAfter(recurring.getEndDate())) {
            recurring.setStatus(RecurringStatus.ENDED);
            recurring.setIsActive(false);
            recurringRepository.save(recurring);
            saveRun(recurring, null, scheduledDate, RecurringRunStatus.SKIPPED,
                    "Đã vượt quá ngày kết thúc");
            return false;
        }

        try {
            TransactionRequest transactionRequest = buildTransactionRequest(recurring);
            TransactionResponse created = transactionService.createTransactionRequiresNew(
                    recurring.getUser().getId(), transactionRequest);

            Transaction generated = transactionRepository.findById(created.getId()).orElse(null);
            if (generated != null) {
                generated.setRecurringTransaction(recurring);
                transactionRepository.save(generated);
            }

            advance(recurring, scheduledDate);
            recurringRepository.save(recurring);
            saveRun(recurring, generated, scheduledDate, RecurringRunStatus.SUCCESS, null);
            return true;
        } catch (Exception e) {
            advance(recurring, scheduledDate);
            recurringRepository.save(recurring);
            saveRun(recurring, null, scheduledDate, RecurringRunStatus.FAILED, e.getMessage());
            log.warn("Recurring transaction {} failed for scheduled date {}: {}",
                    id, scheduledDate, e.getMessage());
            return false;
        }
    }

    public static LocalDate calculateNextRunDate(LocalDate scheduledDate, LocalDate anchorDate,
                                                 RecurringFrequency frequency, Integer intervalCount) {
        int interval = intervalCount != null && intervalCount > 0 ? intervalCount : 1;
        if (frequency == null) {
            return scheduledDate;
        }
        LocalDate anchor = anchorDate != null ? anchorDate : scheduledDate;
        return switch (frequency) {
            case DAILY -> scheduledDate.plusDays(interval);
            case WEEKLY -> scheduledDate.plusWeeks(interval);
            case MONTHLY -> {
                YearMonth target = YearMonth.from(scheduledDate).plusMonths(interval);
                int day = Math.min(anchor.getDayOfMonth(), target.lengthOfMonth());
                yield target.atDay(day);
            }
            case YEARLY -> scheduledDate.plusYears(interval);
        };
    }

    private void advance(RecurringTransaction recurring, LocalDate scheduledDate) {
        LocalDate nextRunDate = calculateNextRunDate(
                scheduledDate, recurring.getStartDate(), recurring.getFrequency(), recurring.getIntervalCount());
        recurring.setLastRunDate(scheduledDate);
        recurring.setNextRunDate(nextRunDate);
        if (recurring.getEndDate() != null && nextRunDate.isAfter(recurring.getEndDate())) {
            recurring.setStatus(RecurringStatus.ENDED);
            recurring.setIsActive(false);
        }
    }

    private TransactionRequest buildTransactionRequest(RecurringTransaction recurring) {
        TransactionRequest request = new TransactionRequest();
        request.setSpaceId(recurring.getSpace().getId());
        request.setWalletId(recurring.getWallet() != null ? recurring.getWallet().getId() : null);
        request.setCategoryId(recurring.getCategory() != null ? recurring.getCategory().getId() : null);
        request.setType(recurring.getType());
        request.setAmount(recurring.getAmount());
        request.setDescription(recurring.getDescription());
        request.setTransactionDate(recurring.getNextRunDate());
        request.setNote("Tạo tự động từ giao dịch định kỳ #" + recurring.getId());
        return request;
    }

    private void saveRun(RecurringTransaction recurring, Transaction transaction, LocalDate scheduledDate,
                         RecurringRunStatus status, String errorMessage) {
        runRepository.save(RecurringTransactionRun.builder()
                .recurringTransaction(recurring)
                .transaction(transaction)
                .scheduledDate(scheduledDate)
                .executedAt(Instant.now())
                .status(status)
                .errorMessage(truncate(errorMessage, 500))
                .build());
    }

    private RecurringTransaction loadDetailed(Long id) {
        return recurringRepository.findDetailedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recurring transaction", "id", id));
    }

    private Transaction loadTemplate(Long templateTransactionId, Long spaceId, Long userId) {
        if (templateTransactionId == null) {
            return null;
        }
        Transaction template = transactionRepository.findById(templateTransactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", templateTransactionId));
        if (Boolean.TRUE.equals(template.getIsDeleted())) {
            throw new BadRequestException("Template transaction has been deleted");
        }
        spaceService.verifySpaceAccess(template.getSpace().getId(), userId);
        if (!template.getSpace().getId().equals(spaceId)) {
            throw new BadRequestException("Template transaction must belong to the same financial space");
        }
        return template;
    }

    private Category resolveCategory(Long categoryId, Transaction template) {
        if (categoryId != null) {
            return categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));
        }
        return template != null ? template.getCategory() : null;
    }

    private Wallet resolveWallet(Long walletId, Transaction template, Long userId) {
        if (walletId != null) {
            return loadWallet(walletId, userId);
        }
        if (template != null && template.getWallet() != null) {
            Wallet wallet = template.getWallet();
            if (!wallet.getUser().getId().equals(userId)) {
                throw new AccessDeniedException("You don't own this wallet");
            }
            return wallet;
        }
        return null;
    }

    private Wallet loadWallet(Long walletId, Long userId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet", "id", walletId));
        if (!wallet.getUser().getId().equals(userId)) {
            throw new AccessDeniedException("You don't own this wallet");
        }
        return wallet;
    }

    private void validateFields(TransactionType type, Category category, BigDecimal amount, Long userId) {
        if (type == null) {
            throw new BadRequestException("Transaction type is required");
        }
        if (type == TransactionType.TRANSFER) {
            throw new BadRequestException("Giao dịch định kỳ chưa hỗ trợ loại TRANSFER");
        }
        if (category == null) {
            throw new BadRequestException("Category is required");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Amount must be greater than 0");
        }
        if (!Boolean.TRUE.equals(category.getIsActive())) {
            throw new BadRequestException("Category is not active");
        }
        if (!Boolean.TRUE.equals(category.getIsSystem())
                && (category.getUser() == null || !category.getUser().getId().equals(userId))) {
            throw new AccessDeniedException("You don't own this category");
        }

        CategoryType categoryType = category.getType();
        if (categoryType != null && categoryType != CategoryType.BOTH) {
            if (type == TransactionType.INCOME && categoryType != CategoryType.INCOME) {
                throw new BadRequestException("Category is not an income category");
            }
            if (type == TransactionType.EXPENSE && categoryType != CategoryType.EXPENSE) {
                throw new BadRequestException("Category is not an expense category");
            }
        }
    }

    private void validateDates(LocalDate startDate, LocalDate endDate, LocalDate nextRunDate) {
        if (startDate == null) {
            throw new BadRequestException("Start date is required");
        }
        if (endDate != null && endDate.isBefore(startDate)) {
            throw new BadRequestException("End date must be on or after start date");
        }
        if (nextRunDate != null && nextRunDate.isBefore(startDate)) {
            throw new BadRequestException("Next run date must be on or after start date");
        }
    }

    private void verifyModifyAccess(RecurringTransaction recurring, Long userId) {
        if (recurring.getUser().getId().equals(userId)) {
            return;
        }
        boolean isSpaceOwner = recurring.getSpace().getOwner().getId().equals(userId);
        boolean isSpaceAdmin = familyMemberRepository
                .findRoleBySpaceIdAndUserId(recurring.getSpace().getId(), userId)
                .map(role -> role == FamilyRole.OWNER || role == FamilyRole.ADMIN)
                .orElse(false);
        if (!isSpaceOwner && !isSpaceAdmin) {
            throw new AccessDeniedException(
                    "Bạn chỉ có thể thay đổi giao dịch định kỳ do chính mình tạo ra");
        }
    }

    private ZoneId resolveZone(String timezone) {
        try {
            return ZoneId.of(timezone);
        } catch (Exception e) {
            return ZoneId.of("Asia/Ho_Chi_Minh");
        }
    }

    private RecurringTransactionResponse mapToResponse(RecurringTransaction recurring) {
        return RecurringTransactionResponse.builder()
                .id(recurring.getId())
                .userId(recurring.getUser().getId())
                .userName(recurring.getUser().getFullName())
                .spaceId(recurring.getSpace().getId())
                .spaceName(recurring.getSpace().getName())
                .templateTransactionId(recurring.getTemplateTransaction() != null
                        ? recurring.getTemplateTransaction().getId()
                        : null)
                .walletId(recurring.getWallet() != null ? recurring.getWallet().getId() : null)
                .walletName(recurring.getWallet() != null ? recurring.getWallet().getName() : null)
                .category(recurring.getCategory() != null
                        ? CategoryServiceImpl.mapCategoryStatic(recurring.getCategory())
                        : null)
                .type(recurring.getType())
                .amount(recurring.getAmount())
                .description(recurring.getDescription())
                .frequency(recurring.getFrequency())
                .intervalCount(recurring.getIntervalCount())
                .startDate(recurring.getStartDate())
                .endDate(recurring.getEndDate())
                .nextRunDate(recurring.getNextRunDate())
                .lastRunDate(recurring.getLastRunDate())
                .status(recurring.getStatus())
                .isActive(recurring.getIsActive())
                .timezone(recurring.getUser().getTimezone())
                .createdAt(recurring.getCreatedAt())
                .updatedAt(recurring.getUpdatedAt())
                .build();
    }

    private RecurringTransactionRunResponse mapRun(RecurringTransactionRun run, ZoneId zone) {
        Instant executedAt = run.getExecutedAt();
        String executedAtLocal = executedAt != null
                ? LOCAL_DATE_TIME_FORMAT.withZone(zone).format(executedAt)
                : null;
        return RecurringTransactionRunResponse.builder()
                .id(run.getId())
                .recurringTransactionId(run.getRecurringTransaction().getId())
                .transactionId(run.getTransaction() != null ? run.getTransaction().getId() : null)
                .scheduledDate(run.getScheduledDate())
                .executedAt(executedAt)
                .executedAtLocal(executedAtLocal)
                .timezone(zone.getId())
                .status(run.getStatus())
                .errorMessage(run.getErrorMessage())
                .build();
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
