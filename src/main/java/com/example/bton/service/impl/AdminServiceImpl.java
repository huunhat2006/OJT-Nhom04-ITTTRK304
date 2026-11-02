// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.response.*;
import com.example.bton.entity.AuditLog;
import com.example.bton.entity.User;
import com.example.bton.enums.Role;
import com.example.bton.enums.SpaceType;
import com.example.bton.exception.BadRequestException;
import com.example.bton.exception.ResourceNotFoundException;
import com.example.bton.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl {

    private final UserRepository userRepository;
    private final FinancialSpaceRepository spaceRepository;
    private final TransactionRepository transactionRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserServiceImpl userService;

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        long totalUsers = userRepository.countByRole(Role.USER);
        long activeUsers = userRepository.countByIsActive(true) - userRepository.countByRole(Role.ADMIN);
        long totalSpaces = spaceRepository.count();
        long familySpaces = spaceRepository.countByType(SpaceType.FAMILY);
        long newUsersThisMonth = userRepository.countNewUsersSince(
                LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0));
        long totalTransactionsThisMonth = transactionRepository.countByDateRange(
                LocalDate.now().withDayOfMonth(1), LocalDate.now());

        // User registration trend (last 6 months)
        LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6);
        List<Object[]> regTrend = userRepository.countUserRegistrationsByMonth(sixMonthsAgo);
        List<Map<String, Object>> regTrendData = new ArrayList<>();
        for (Object[] row : regTrend) {
            Map<String, Object> point = new HashMap<>();
            point.put("year", ((Number) row[0]).intValue());
            point.put("month", ((Number) row[1]).intValue());
            point.put("label", row[1] + "/" + row[0]);
            point.put("count", ((Number) row[2]).longValue());
            regTrendData.add(point);
        }

        // Transaction trend (last 6 months)
        LocalDate sixMonthsAgoDate = LocalDate.now().minusMonths(6);
        List<Object[]> txTrend = transactionRepository.countTransactionsByMonth(sixMonthsAgoDate);
        List<Map<String, Object>> txTrendData = new ArrayList<>();
        for (Object[] row : txTrend) {
            Map<String, Object> point = new HashMap<>();
            point.put("year", ((Number) row[0]).intValue());
            point.put("month", ((Number) row[1]).intValue());
            point.put("label", row[1] + "/" + row[0]);
            point.put("count", ((Number) row[2]).longValue());
            txTrendData.add(point);
        }

        return AdminDashboardResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .totalSpaces(totalSpaces)
                .familySpaces(familySpaces)
                .totalTransactionsThisMonth(totalTransactionsThisMonth)
                .newUsersThisMonth(newUsersThisMonth)
                .userRegistrationTrend(regTrendData)
                .transactionTrend(txTrendData)
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> searchUsers(String keyword, Role role,
                                                   Boolean isActive, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> userPage = userRepository.searchUsers(keyword, role, isActive, pageable);
        return PageResponse.<UserResponse>builder()
                .content(userPage.getContent().stream()
                        .map(userService::mapToResponse).collect(Collectors.toList()))
                .pageNumber(userPage.getNumber())
                .pageSize(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .first(userPage.isFirst())
                .last(userPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return userService.mapToResponse(user);
    }

    @Transactional
    public UserResponse toggleUserStatus(Long userId, Long adminId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Cannot disable another admin account");
        }
        user.setIsActive(!user.getIsActive());
        User saved = userRepository.save(user);

        // Log audit
        saveAuditLog(adminId,
                user.getIsActive() ? "ENABLE_USER" : "DISABLE_USER",
                "User", userId,
                "Admin " + adminId + " changed status of user " + userId);

        return userService.mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> getAuditLogs(Long adminId, String action,
                                                        int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> logPage = auditLogRepository.searchLogs(adminId, action, pageable);
        return PageResponse.<AuditLogResponse>builder()
                .content(logPage.getContent().stream()
                        .map(this::mapAuditToResponse).collect(Collectors.toList()))
                .pageNumber(logPage.getNumber())
                .pageSize(logPage.getSize())
                .totalElements(logPage.getTotalElements())
                .totalPages(logPage.getTotalPages())
                .first(logPage.isFirst())
                .last(logPage.isLast())
                .build();
    }

    @Transactional
    public void saveAuditLog(Long adminId, String action, String targetType,
                              Long targetId, String description) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin", "id", adminId));
        AuditLog log = AuditLog.builder()
                .admin(admin).action(action).targetType(targetType)
                .targetId(targetId).description(description).build();
        auditLogRepository.save(log);
    }

    private AuditLogResponse mapAuditToResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .adminId(log.getAdmin().getId())
                .adminUsername(log.getAdmin().getUsername())
                .adminFullName(log.getAdmin().getFullName())
                .action(log.getAction())
                .targetType(log.getTargetType())
                .targetId(log.getTargetId())
                .description(log.getDescription())
                .ipAddress(log.getIpAddress())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
