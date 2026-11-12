// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.response.NotificationResponse;
import com.example.bton.dto.response.PageResponse;
import com.example.bton.entity.Notification;
import com.example.bton.entity.User;
import com.example.bton.enums.NotificationType;
import com.example.bton.exception.ResourceNotFoundException;
import com.example.bton.repository.NotificationRepository;
import com.example.bton.repository.TransactionRepository;
import com.example.bton.repository.UserRepository;
import com.example.bton.service.EmailService;
import com.example.bton.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final EmailService emailService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getNotifications(Long userId, Boolean isRead, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifPage = notificationRepository.findByUserIdWithFilter(userId, isRead, pageable);
        return PageResponse.<NotificationResponse>builder()
                .content(notifPage.getContent().stream()
                        .map(this::mapToResponse).toList())
                .pageNumber(notifPage.getNumber())
                .pageSize(notifPage.getSize())
                .totalElements(notifPage.getTotalElements())
                .totalPages(notifPage.getTotalPages())
                .first(notifPage.isFirst())
                .last(notifPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.markAsReadByIdAndUserId(notificationId, userId);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    @Override
    @Transactional
    public void send(Long userId, String title, String message, NotificationType type, Long relatedId, boolean sendEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .relatedId(relatedId)
                .isRead(false)
                .build();
        notificationRepository.save(notification);

        if (sendEmail && user.getEmail() != null && !user.getEmail().isBlank()) {
            emailService.sendNotificationEmail(user.getEmail(), user.getFullName(), title, message, type);
        }
    }

    @Override
    @Transactional
    public void send(Long userId, String title, String message, NotificationType type, Long relatedId) {
        send(userId, title, message, type, relatedId, true);
    }

    @Override
    @Transactional
    public void send(Long userId, String title, String message, NotificationType type) {
        send(userId, title, message, type, null, true);
    }

    @Override
    @Transactional
    public void createNotification(Long userId, String title, String message, NotificationType type, Long relatedId) {
        send(userId, title, message, type, relatedId, false);
    }

    /**
     * Gửi báo cáo tài chính tuần vào 08:00 sáng thứ Hai hàng tuần
     */
    @Override
    @Scheduled(cron = "0 0 8 * * MON")
    @Transactional
    public void sendWeeklySummaryReport() {
        log.info("Starting scheduled weekly summary report at 08:00 AM Monday...");
        LocalDate today = LocalDate.now();
        LocalDate lastWeekMonday = today.minusWeeks(1).with(DayOfWeek.MONDAY);
        LocalDate lastWeekSunday = today.minusWeeks(1).with(DayOfWeek.SUNDAY);

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String weekRange = lastWeekMonday.format(dtf) + " - " + lastWeekSunday.format(dtf);

        List<User> users = userRepository.findAll();
        for (User user : users) {
            processUserWeeklySummary(user, lastWeekMonday, lastWeekSunday, weekRange);
        }
        log.info("Weekly summary report completed for {} users.", users.size());
    }

    private void processUserWeeklySummary(User user, LocalDate lastWeekMonday, LocalDate lastWeekSunday, String weekRange) {
        try {
            List<Object[]> totals = transactionRepository.sumTotalsByUserIdAndDateRange(
                    user.getId(), lastWeekMonday, lastWeekSunday);

            BigDecimal income = BigDecimal.ZERO;
            BigDecimal expense = BigDecimal.ZERO;

            if (!totals.isEmpty() && totals.get(0) != null) {
                Object[] row = totals.get(0);
                if (row.length > 0 && row[0] != null) income = (BigDecimal) row[0];
                if (row.length > 1 && row[1] != null) expense = (BigDecimal) row[1];
            }

            BigDecimal balance = income.subtract(expense);

            String summaryMessage = String.format(
                    "Báo cáo tuần (%s): Tổng thu %,.0f VNĐ, Tổng chi %,.0f VNĐ. Số dư tuần: %,.0f VNĐ.",
                    weekRange, income.doubleValue(), expense.doubleValue(), balance.doubleValue());

            Notification notification = Notification.builder()
                    .user(user)
                    .title("Báo cáo tài chính tuần (" + weekRange + ")")
                    .message(summaryMessage)
                    .type(NotificationType.WEEKLY_SUMMARY)
                    .isRead(false)
                    .build();
            notificationRepository.save(notification);

            if (user.getEmail() != null && !user.getEmail().isBlank()) {
                emailService.sendWeeklyReportEmail(
                        user.getEmail(),
                        user.getFullName(),
                        weekRange,
                        income,
                        expense,
                        balance,
                        summaryMessage);
            }
        } catch (Exception e) {
            log.warn("Failed to generate weekly summary for user {}: {}", user.getId(), e.getMessage());
        }
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .userId(n.getUserId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .relatedId(n.getRelatedId())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
