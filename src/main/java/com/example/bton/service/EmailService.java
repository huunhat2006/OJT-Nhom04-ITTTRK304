// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service;

import com.example.bton.enums.NotificationType;

import java.math.BigDecimal;

public interface EmailService {

    /**
     * Send notification email asynchronously using Thymeleaf template.
     */
    void sendNotificationEmail(String to, String recipientName, String title, String message, NotificationType type);

    /**
     * Send weekly financial report email asynchronously using Thymeleaf template.
     */
    void sendWeeklyReportEmail(String to, String recipientName, String weekRange,
                               BigDecimal totalIncome, BigDecimal totalExpense, BigDecimal balance,
                               String summaryMessage);
}

