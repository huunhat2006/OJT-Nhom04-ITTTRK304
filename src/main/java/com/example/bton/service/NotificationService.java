// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service;

import com.example.bton.dto.response.NotificationResponse;
import com.example.bton.dto.response.PageResponse;
import com.example.bton.enums.NotificationType;

public interface NotificationService {

    PageResponse<NotificationResponse> getNotifications(Long userId, Boolean isRead, int page, int size);

    long getUnreadCount(Long userId);

    void markAsRead(Long notificationId, Long userId);

    void markAllAsRead(Long userId);

    void send(Long userId, String title, String message, NotificationType type, Long relatedId, boolean sendEmail);

    void send(Long userId, String title, String message, NotificationType type, Long relatedId);

    void send(Long userId, String title, String message, NotificationType type);

    void createNotification(Long userId, String title, String message, NotificationType type, Long relatedId);

    void sendWeeklySummaryReport();
}

