// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.request.SavingsGoalRequest;
import com.example.bton.dto.request.SavingsGoalTransactionRequest;
import com.example.bton.dto.request.UpdateSavingsAmountRequest;
import com.example.bton.dto.response.SavingsGoalProgressResponse;
import com.example.bton.dto.response.SavingsGoalResponse;
import com.example.bton.dto.response.SavingsGoalSummaryResponse;
import com.example.bton.entity.Category;
import com.example.bton.entity.FinancialSpace;
import com.example.bton.entity.SavingsGoal;
import com.example.bton.entity.Transaction;
import com.example.bton.entity.User;
import com.example.bton.entity.Wallet;
import com.example.bton.enums.CategoryType;
import com.example.bton.enums.GoalStatus;
import com.example.bton.enums.NotificationType;
import com.example.bton.enums.TransactionType;
import com.example.bton.exception.AccessDeniedException;
import com.example.bton.exception.BadRequestException;
import com.example.bton.exception.ResourceNotFoundException;
import com.example.bton.repository.CategoryRepository;
import com.example.bton.repository.FinancialSpaceRepository;
import com.example.bton.repository.SavingsGoalRepository;
import com.example.bton.repository.TransactionRepository;
import com.example.bton.repository.UserRepository;
import com.example.bton.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavingsGoalServiceImpl {

    private final SavingsGoalRepository goalRepository;
    private final FinancialSpaceRepository spaceRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final FinancialSpaceServiceImpl spaceService;
    private final NotificationServiceImpl notificationService;

    @Transactional(readOnly = true)
    public List<SavingsGoalResponse> getGoals(Long spaceId, Long userId) {
        spaceService.verifySpaceAccess(spaceId, userId);
        return goalRepository.findBySpaceIdOrderByCreatedAtDesc(spaceId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SavingsGoalResponse getGoalById(Long goalId, Long userId) {
        SavingsGoal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal", "id", goalId));
        spaceService.verifySpaceAccess(goal.getSpace().getId(), userId);
        return mapToResponse(goal);
    }

    @Transactional
    public SavingsGoalResponse createGoal(Long userId, SavingsGoalRequest request) {
        spaceService.verifySpaceAccess(request.getSpaceId(), userId);

        FinancialSpace space = spaceRepository.findByIdAndIsActiveTrue(request.getSpaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Financial space", "id", request.getSpaceId()));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        BigDecimal initialAmount = request.getInitialAmount() != null
                ? request.getInitialAmount() : BigDecimal.ZERO;

        SavingsGoal goal = SavingsGoal.builder()
                .space(space)
                .user(user)
                .name(request.getName())
                .description(request.getDescription())
                .targetAmount(request.getTargetAmount())
                .currentAmount(initialAmount)
                .startDate(request.getStartDate())
                .deadline(request.getDeadline())
                .status(initialAmount.compareTo(request.getTargetAmount()) >= 0
                        ? GoalStatus.COMPLETED : GoalStatus.IN_PROGRESS)
                .icon(request.getIcon())
                .color(request.getColor())
                .build();

        return mapToResponse(goalRepository.save(goal));
    }

    @Transactional
    public SavingsGoalResponse updateGoal(Long goalId, Long userId, SavingsGoalRequest request) {
        SavingsGoal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal", "id", goalId));
        spaceService.verifySpaceAccess(goal.getSpace().getId(), userId);

        goal.setName(request.getName());
        if (request.getDescription() != null) goal.setDescription(request.getDescription());
        goal.setTargetAmount(request.getTargetAmount());
        if (request.getStartDate() != null) goal.setStartDate(request.getStartDate());
        goal.setDeadline(request.getDeadline());
        if (request.getIcon() != null) goal.setIcon(request.getIcon());
        if (request.getColor() != null) goal.setColor(request.getColor());

        return mapToResponse(goalRepository.save(goal));
    }

    @Transactional
    public SavingsGoalResponse updateCurrentAmount(Long goalId, Long userId,
                                                    UpdateSavingsAmountRequest request) {
        SavingsGoal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal", "id", goalId));
        spaceService.verifySpaceAccess(goal.getSpace().getId(), userId);

        if (goal.getStatus() == GoalStatus.CANCELLED) {
            throw new BadRequestException("Cannot update a cancelled goal");
        }

        boolean wasCompleted = goal.getStatus() == GoalStatus.COMPLETED;
        goal.setCurrentAmount(request.getAmount());
        applyCompletion(goal, wasCompleted);

        return mapToResponse(goalRepository.save(goal));
    }

    /**
     * Nạp tiền vào mục tiêu: tạo giao dịch EXPENSE tương ứng và trừ số dư ví.
     */
    @Transactional
    public SavingsGoalResponse deposit(Long goalId, Long userId, SavingsGoalTransactionRequest request) {
        SavingsGoal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal", "id", goalId));
        spaceService.verifySpaceAccess(goal.getSpace().getId(), userId);

        if (goal.getStatus() == GoalStatus.CANCELLED) {
            throw new BadRequestException("Không thể nạp tiền vào mục tiêu đã hủy");
        }
        if (goal.getStatus() == GoalStatus.COMPLETED) {
            throw new BadRequestException("Mục tiêu đã hoàn thành, không thể nạp thêm");
        }

        BigDecimal amount = request.getAmount();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Wallet wallet = resolveWallet(goal, userId, request.getWalletId());

        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Số dư ví không đủ để nạp tiền vào mục tiêu");
        }

        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);

        Category category = categoryRepository
                .findFirstByNameAndTypeAndIsSystemTrueAndIsActiveTrue("Savings", CategoryType.EXPENSE)
                .orElse(null);

        Transaction transaction = Transaction.builder()
                .space(goal.getSpace())
                .user(user)
                .category(category)
                .type(TransactionType.EXPENSE)
                .amount(amount)
                .description(buildNote(request.getNote(), "Nạp tiền vào mục tiêu: " + goal.getName()))
                .transactionDate(LocalDate.now())
                .wallet(wallet)
                .isDeleted(false)
                .build();
        transactionRepository.save(transaction);

        boolean wasCompleted = goal.getStatus() == GoalStatus.COMPLETED;
        goal.setCurrentAmount(goal.getCurrentAmount().add(amount));
        applyCompletion(goal, wasCompleted);

        return mapToResponse(goalRepository.save(goal));
    }

    /**
     * Rút tiền khỏi mục tiêu: tạo giao dịch INCOME tương ứng và cộng lại vào ví.
     */
    @Transactional
    public SavingsGoalResponse withdraw(Long goalId, Long userId, SavingsGoalTransactionRequest request) {
        SavingsGoal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal", "id", goalId));
        spaceService.verifySpaceAccess(goal.getSpace().getId(), userId);

        if (goal.getStatus() == GoalStatus.CANCELLED) {
            throw new BadRequestException("Không thể rút tiền từ mục tiêu đã hủy");
        }

        BigDecimal amount = request.getAmount();
        if (goal.getCurrentAmount().compareTo(amount) < 0) {
            throw new BadRequestException("Số tiền rút vượt quá số tiền đã tiết kiệm");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Wallet wallet = resolveWallet(goal, userId, request.getWalletId());

        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);

        Transaction transaction = Transaction.builder()
                .space(goal.getSpace())
                .user(user)
                .category(null)
                .type(TransactionType.INCOME)
                .amount(amount)
                .description(buildNote(request.getNote(), "Rút tiền từ mục tiêu: " + goal.getName()))
                .transactionDate(LocalDate.now())
                .wallet(wallet)
                .isDeleted(false)
                .build();
        transactionRepository.save(transaction);

        boolean wasCompleted = goal.getStatus() == GoalStatus.COMPLETED;
        goal.setCurrentAmount(goal.getCurrentAmount().subtract(amount));
        applyCompletion(goal, wasCompleted);

        return mapToResponse(goalRepository.save(goal));
    }

    @Transactional(readOnly = true)
    public SavingsGoalProgressResponse getProgress(Long goalId, Long userId) {
        SavingsGoal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal", "id", goalId));
        spaceService.verifySpaceAccess(goal.getSpace().getId(), userId);

        BigDecimal percent = goal.getTargetAmount().compareTo(BigDecimal.ZERO) > 0
                ? goal.getCurrentAmount()
                .multiply(new BigDecimal("100"))
                .divide(goal.getTargetAmount(), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal remaining = goal.getTargetAmount().subtract(goal.getCurrentAmount());
        if (remaining.compareTo(BigDecimal.ZERO) < 0) remaining = BigDecimal.ZERO;

        LocalDate today = LocalDate.now();
        Long daysLeft = goal.getDeadline() != null
                ? ChronoUnit.DAYS.between(today, goal.getDeadline())
                : null;

        LocalDate estimatedCompletionDate = estimateCompletionDate(goal, remaining, today);

        return SavingsGoalProgressResponse.builder()
                .goalId(goal.getId())
                .percent(percent)
                .remainingAmount(remaining)
                .estimatedCompletionDate(estimatedCompletionDate)
                .daysLeft(daysLeft)
                .build();
    }

    @Transactional(readOnly = true)
    public SavingsGoalSummaryResponse getSummary(Long spaceId, Long userId) {
        spaceService.verifySpaceAccess(spaceId, userId);

        List<SavingsGoal> goals = goalRepository.findBySpaceIdOrderByCreatedAtDesc(spaceId);
        long totalGoals = goals.size();
        long completedGoals = goals.stream()
                .filter(goal -> goal.getStatus() == GoalStatus.COMPLETED)
                .count();
        BigDecimal totalSaved = goals.stream()
                .map(SavingsGoal::getCurrentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalTarget = goals.stream()
                .map(SavingsGoal::getTargetAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return SavingsGoalSummaryResponse.builder()
                .totalGoals(totalGoals)
                .completedGoals(completedGoals)
                .totalSaved(totalSaved)
                .totalTarget(totalTarget)
                .build();
    }

    @Transactional
    public void cancelGoal(Long goalId, Long userId) {
        SavingsGoal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal", "id", goalId));
        spaceService.verifySpaceAccess(goal.getSpace().getId(), userId);
        goal.setStatus(GoalStatus.CANCELLED);
        goalRepository.save(goal);
    }

    @Transactional
    public void deleteGoal(Long goalId, Long userId) {
        SavingsGoal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Savings goal", "id", goalId));
        spaceService.verifySpaceAccess(goal.getSpace().getId(), userId);
        goalRepository.delete(goal);
    }

    private Wallet resolveWallet(SavingsGoal goal, Long userId, Long walletId) {
        if (walletId != null) {
            Wallet wallet = walletRepository.findById(walletId)
                    .orElseThrow(() -> new ResourceNotFoundException("Wallet", "id", walletId));
            if (!wallet.getUser().getId().equals(userId)) {
                throw new AccessDeniedException("Bạn không sở hữu ví này");
            }
            return wallet;
        }
        return walletRepository.findBySpaceIdAndUserId(goal.getSpace().getId(), userId)
                .orElseThrow(() -> new BadRequestException("Vui lòng chọn ví để thực hiện giao dịch"));
    }

    private void applyCompletion(SavingsGoal goal, boolean wasCompleted) {
        if (goal.getCurrentAmount().compareTo(goal.getTargetAmount()) >= 0) {
            goal.setStatus(GoalStatus.COMPLETED);
            if (!wasCompleted) {
                notificationService.createNotification(
                        goal.getUser().getId(),
                        "Chúc mừng! Bạn đã đạt mục tiêu tiết kiệm",
                        "Bạn đã hoàn thành mục tiêu '" + goal.getName() + "' với số tiền "
                                + goal.getTargetAmount() + " VNĐ. Tuyệt vời!",
                        NotificationType.GOAL_ACHIEVED,
                        goal.getId());
            }
        } else if (goal.getStatus() == GoalStatus.COMPLETED) {
            goal.setStatus(GoalStatus.IN_PROGRESS);
        }
    }

    private LocalDate estimateCompletionDate(SavingsGoal goal, BigDecimal remaining, LocalDate today) {
        if (goal.getStatus() == GoalStatus.COMPLETED) {
            return today;
        }
        if (goal.getCurrentAmount().compareTo(BigDecimal.ZERO) <= 0 || goal.getStartDate() == null) {
            return null;
        }
        long elapsedDays = Math.max(1, ChronoUnit.DAYS.between(goal.getStartDate(), today));
        BigDecimal dailyRate = goal.getCurrentAmount()
                .divide(BigDecimal.valueOf(elapsedDays), 2, RoundingMode.HALF_UP);
        if (dailyRate.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        long daysNeeded = remaining.divide(dailyRate, 0, RoundingMode.CEILING).longValue();
        return today.plusDays(daysNeeded);
    }

    private String buildNote(String note, String defaultNote) {
        return (note != null && !note.isBlank()) ? note : defaultNote;
    }

    public SavingsGoalResponse mapToResponse(SavingsGoal goal) {
        BigDecimal progress = goal.getTargetAmount().compareTo(BigDecimal.ZERO) > 0
                ? goal.getCurrentAmount()
                .multiply(new BigDecimal("100"))
                .divide(goal.getTargetAmount(), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal remaining = goal.getTargetAmount().subtract(goal.getCurrentAmount());
        if (remaining.compareTo(BigDecimal.ZERO) < 0) remaining = BigDecimal.ZERO;

        return SavingsGoalResponse.builder()
                .id(goal.getId())
                .spaceId(goal.getSpace().getId())
                .name(goal.getName())
                .description(goal.getDescription())
                .targetAmount(goal.getTargetAmount())
                .currentAmount(goal.getCurrentAmount())
                .startDate(goal.getStartDate())
                .deadline(goal.getDeadline())
                .status(goal.getStatus())
                .icon(goal.getIcon())
                .color(goal.getColor())
                .progressPercentage(progress)
                .remainingAmount(remaining)
                .createdAt(goal.getCreatedAt())
                .updatedAt(goal.getUpdatedAt())
                .build();
    }
}
