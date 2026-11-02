// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.response.NotificationResponse;
import com.example.bton.dto.response.PageResponse;
import com.example.bton.entity.Notification;
import com.example.bton.entity.User;
import com.example.bton.enums.NotificationType;
import com.example.bton.exception.ResourceNotFoundException;
import com.example.bton.repository.NotificationRepository;
import com.example.bton.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getNotifications(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifPage = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return PageResponse.<NotificationResponse>builder()
                .content(notifPage.getContent().stream()
                        .map(this::mapToResponse).collect(Collectors.toList()))
                .pageNumber(notifPage.getNumber())
                .pageSize(notifPage.getSize())
                .totalElements(notifPage.getTotalElements())
                .totalPages(notifPage.getTotalPages())
                .first(notifPage.isFirst())
                .last(notifPage.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.markAsReadByIdAndUserId(notificationId, userId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    @Transactional
    public void createNotification(Long userId, String title, String message,
                                   NotificationType type, Long relatedId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        Notification notification = Notification.builder()
                .user(user).title(title).message(message).type(type)
                .relatedId(relatedId).isRead(false).build();
        notificationRepository.save(notification);
    }

    private NotificationResponse mapToResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId()).title(n.getTitle()).message(n.getMessage())
                .type(n.getType()).relatedId(n.getRelatedId())
                .isRead(n.getIsRead()).createdAt(n.getCreatedAt()).build();
    }
}
