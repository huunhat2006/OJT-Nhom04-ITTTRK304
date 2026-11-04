// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.enums.NotificationType;
import com.example.bton.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Year;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private final SpringTemplateEngine templateEngine;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${app.frontend-url:https://budgivee.online}")
    private String frontendUrl;

    @Override
    @Async
    public void sendNotificationEmail(String to, String recipientName, String title, String message, NotificationType type) {
        if (!isMailConfigured(to)) {
            return;
        }

        try {
            Context context = new Context();
            context.setVariable("recipientName", (recipientName != null && !recipientName.isBlank()) ? recipientName : "Quý khách");
            context.setVariable("title", title);
            context.setVariable("message", message);
            context.setVariable("typeLabel", getTypeLabel(type));
            context.setVariable("badgeClass", getBadgeClass(type));
            context.setVariable("appUrl", frontendUrl);
            context.setVariable("year", Year.now().getValue());

            String htmlContent = templateEngine.process("email/notification-email", context);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : "no-reply@budgivee.online";
            helper.setFrom(sender, "Budgivee Finance");
            helper.setTo(to);
            helper.setSubject("[BTON] " + title);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info("Notification email sent successfully to {} with subject: {}", to, title);
        } catch (Exception e) {
            log.warn("Failed to send notification email to {}: {}", to, e.getMessage());
        }
    }

    @Override
    @Async
    public void sendWeeklyReportEmail(String to, String recipientName, String weekRange,
                                     BigDecimal totalIncome, BigDecimal totalExpense, BigDecimal balance,
                                     String summaryMessage) {
        if (!isMailConfigured(to)) {
            return;
        }

        try {
            Context context = new Context();
            context.setVariable("recipientName", (recipientName != null && !recipientName.isBlank()) ? recipientName : "Quý khách");
            context.setVariable("weekRange", weekRange);
            context.setVariable("totalIncome", formatCurrency(totalIncome));
            context.setVariable("totalExpense", formatCurrency(totalExpense));
            context.setVariable("balance", formatCurrency(balance));
            context.setVariable("summaryMessage", summaryMessage);
            context.setVariable("appUrl", frontendUrl);
            context.setVariable("year", Year.now().getValue());

            String htmlContent = templateEngine.process("email/weekly-report-email", context);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : "no-reply@budgivee.online";
            helper.setFrom(sender, "Budgivee Finance");
            helper.setTo(to);
            helper.setSubject("📊 [BTON] Báo cáo tài chính tuần (" + weekRange + ")");
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info("Weekly report email sent successfully to {}", to);
        } catch (Exception e) {
            log.warn("Failed to send weekly report email to {}: {}", to, e.getMessage());
        }
    }

    private boolean isMailConfigured(String to) {
        if (mailSender == null) {
            log.debug("JavaMailSender bean is not configured, skipping email delivery to {}", to);
            return false;
        }
        if (to == null || to.isBlank() || !to.contains("@")) {
            log.debug("Invalid email recipient: {}, skipping email", to);
            return false;
        }
        return true;
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0 VNĐ";
        return String.format("%,.0f VNĐ", amount.doubleValue());
    }

    private String getTypeLabel(NotificationType type) {
        if (type == null) return "Thông báo";
        return switch (type) {
            case BUDGET_EXCEEDED -> "Vượt ngân sách";
            case BUDGET_WARNING -> "Cảnh báo ngân sách";
            case GOAL_COMPLETED, GOAL_ACHIEVED -> "Mục tiêu tài chính";
            case GOAL_DEADLINE -> "Hạn chót mục tiêu";
            case FAMILY_INVITE -> "Lời mời nhóm gia đình";
            case WEEKLY_SUMMARY -> "Báo cáo tuần";
            default -> "Thông báo";
        };
    }

    private String getBadgeClass(NotificationType type) {
        if (type == null) return "";
        return switch (type) {
            case BUDGET_EXCEEDED -> "badge-exceeded";
            case BUDGET_WARNING -> "badge-warning";
            case GOAL_COMPLETED, GOAL_ACHIEVED -> "badge-goal";
            default -> "";
        };
    }
}

