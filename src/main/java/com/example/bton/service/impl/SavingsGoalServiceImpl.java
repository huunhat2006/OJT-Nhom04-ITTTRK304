// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.request.SavingsGoalRequest;
import com.example.bton.dto.request.UpdateSavingsAmountRequest;
import com.example.bton.dto.response.SavingsGoalResponse;
import com.example.bton.entity.FinancialSpace;
import com.example.bton.entity.SavingsGoal;
import com.example.bton.entity.User;
import com.example.bton.enums.GoalStatus;
import com.example.bton.exception.BadRequestException;
import com.example.bton.exception.ResourceNotFoundException;
import com.example.bton.repository.FinancialSpaceRepository;
import com.example.bton.repository.SavingsGoalRepository;
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
public class SavingsGoalServiceImpl {

    private final SavingsGoalRepository goalRepository;
    private final FinancialSpaceRepository spaceRepository;
    private final UserRepository userRepository;
    private final FinancialSpaceServiceImpl spaceService;

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

        goal.setCurrentAmount(request.getAmount());

        // Auto-complete when target reached
        if (goal.getCurrentAmount().compareTo(goal.getTargetAmount()) >= 0) {
            goal.setStatus(GoalStatus.COMPLETED);
        } else if (goal.getStatus() == GoalStatus.COMPLETED) {
            goal.setStatus(GoalStatus.IN_PROGRESS);
        }

        return mapToResponse(goalRepository.save(goal));
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
