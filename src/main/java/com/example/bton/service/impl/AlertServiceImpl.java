// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service.impl;

import com.example.bton.dto.response.SpendingAlertResponse;
import com.example.bton.dto.response.SpendingAnalysisResponse;
import com.example.bton.dto.response.SpendingHealthScoreResponse;
import com.example.bton.dto.response.SpendingRecommendationResponse;
import com.example.bton.entity.Budget;
import com.example.bton.entity.Category;
import com.example.bton.entity.FinancialSpace;
import com.example.bton.entity.Notification;
import com.example.bton.entity.RecurringTransaction;
import com.example.bton.entity.User;
import com.example.bton.enums.AlertSeverity;
import com.example.bton.enums.NotificationType;
import com.example.bton.enums.SpaceType;
import com.example.bton.enums.SpendingAlertType;
import com.example.bton.exception.ResourceNotFoundException;
import com.example.bton.repository.BudgetRepository;
import com.example.bton.repository.FinancialSpaceRepository;
import com.example.bton.repository.NotificationRepository;
import com.example.bton.repository.RecurringTransactionRepository;
import com.example.bton.repository.TransactionRepository;
import com.example.bton.repository.UserRepository;
import com.example.bton.service.AlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertServiceImpl implements AlertService {

    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;
    private final RecurringTransactionRepository recurringTransactionRepository;
    private final FinancialSpaceRepository spaceRepository;
    private final FinancialSpaceServiceImpl spaceService;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public Long resolveSpaceId(Long spaceId, Long userId) {
        if (spaceId != null) {
            return spaceId;
        }
        return spaceRepository.findFirstByOwnerIdAndTypeAndIsActiveTrue(userId, SpaceType.PERSONAL)
                .map(FinancialSpace::getId)
                .orElseGet(() -> spaceRepository.findAccessibleSpaces(userId).stream()
                        .findFirst()
                        .map(FinancialSpace::getId)
                        .orElseThrow(() -> new ResourceNotFoundException("No accessible financial space found for user: " + userId)));
    }

    @Override
    @Transactional(readOnly = true)
    public SpendingAnalysisResponse getSpendingAnalysis(Long spaceId, Long userId, Integer month, Integer year) {
        Long resolvedSpaceId = resolveSpaceId(spaceId, userId);
        spaceService.verifySpaceAccess(resolvedSpaceId, userId);

        LocalDate today = LocalDate.now();
        int m = (month != null && month >= 1 && month <= 12) ? month : today.getMonthValue();
        int y = (year != null && year >= 2000) ? year : today.getYear();
        boolean isCurrentMonth = (m == today.getMonthValue() && y == today.getYear());

        YearMonth ym = YearMonth.of(y, m);
        int totalDays = ym.lengthOfMonth();
        int daysPassed = isCurrentMonth ? today.getDayOfMonth() : (ym.isBefore(YearMonth.now()) ? totalDays : 1);
        String nowIso = Instant.now().toString();

        List<SpendingAlertResponse> alerts = new ArrayList<>();

        // 1 & 2. Budget Exceeded, Budget Warning, Rapid Spending, Budget Pace Warning
        List<Budget> budgets = budgetRepository.findBySpaceAndMonthWithCategory(resolvedSpaceId, m, y);
        for (Budget budget : budgets) {
            Category category = budget.getCategory();
            if (category == null) continue;

            String categoryName = (category.getNameVi() != null && !category.getNameVi().isBlank())
                    ? category.getNameVi()
                    : category.getName();

            BigDecimal budgetAmount = budget.getAmount() != null ? budget.getAmount() : BigDecimal.ZERO;
            BigDecimal spent = transactionRepository.sumExpenseBySpaceCategoryAndMonth(
                    resolvedSpaceId, category.getId(), y, m);
            if (spent == null) spent = BigDecimal.ZERO;

            if (budgetAmount.compareTo(BigDecimal.ZERO) <= 0) continue;

            double spentPercent = spent.multiply(BigDecimal.valueOf(100))
                    .divide(budgetAmount, 2, RoundingMode.HALF_UP)
                    .doubleValue();

            double warningThreshold = budget.getWarningThreshold() != null
                    ? budget.getWarningThreshold().doubleValue()
                    : 80.0;

            // (a) Chi tiêu vượt ngân sách
            if (spent.compareTo(budgetAmount) > 0) {
                Map<String, Object> meta = new LinkedHashMap<>();
                meta.put("currentAmount", spent);
                meta.put("budgetAmount", budgetAmount);
                meta.put("spentPercent", Math.round(spentPercent));
                meta.put("budgetId", budget.getId());

                alerts.add(SpendingAlertResponse.builder()
                        .alertType(SpendingAlertType.BUDGET_EXCEEDED)
                        .severity(AlertSeverity.CRITICAL)
                        .title("Vượt ngân sách " + categoryName)
                        .message(String.format("Bạn đã chi %,.0f VNĐ cho %s, vượt %.0f%% ngân sách đã đặt (%,.0f VNĐ).",
                                spent.doubleValue(), categoryName, spentPercent, budgetAmount.doubleValue()))
                        .amount(spent)
                        .threshold(budgetAmount)
                        .categoryName(categoryName)
                        .categoryId(category.getId())
                        .detectedAt(nowIso)
                        .metadata(meta)
                        .build());
            }
            // (b) Cảnh báo sắp vượt ngân sách
            else if (spentPercent >= warningThreshold) {
                Map<String, Object> meta = new LinkedHashMap<>();
                meta.put("currentAmount", spent);
                meta.put("budgetAmount", budgetAmount);
                meta.put("spentPercent", Math.round(spentPercent));
                meta.put("budgetId", budget.getId());
                meta.put("warningThreshold", warningThreshold);

                alerts.add(SpendingAlertResponse.builder()
                        .alertType(SpendingAlertType.BUDGET_WARNING)
                        .severity(AlertSeverity.MEDIUM)
                        .title("Sắp vượt ngân sách " + categoryName)
                        .message(String.format("Bạn đã chi %.0f%% ngân sách %s (%,.0f / %,.0f VNĐ). Hãy cân nhắc chi tiêu thận trọng.",
                                spentPercent, categoryName, spent.doubleValue(), budgetAmount.doubleValue()))
                        .amount(spent)
                        .threshold(budgetAmount)
                        .categoryName(categoryName)
                        .categoryId(category.getId())
                        .detectedAt(nowIso)
                        .metadata(meta)
                        .build());
            }

            // (c) Chi tiêu quá nhanh & Tốc độ chi tiêu (chỉ áp dụng cho tháng hiện tại khi chưa vượt ngân sách)
            if (isCurrentMonth && daysPassed < totalDays && spent.compareTo(budgetAmount) < 0 && daysPassed > 0) {
                double dayProgressPercent = ((double) daysPassed / totalDays) * 100.0;

                if (spentPercent >= 65.0 && dayProgressPercent <= 45.0) {
                    double dailyRate = spent.doubleValue() / daysPassed;
                    double remainingBudget = budgetAmount.doubleValue() - spent.doubleValue();
                    int daysUntilOut = (int) Math.round(remainingBudget / dailyRate);
                    int estimatedRunOutDay = Math.min(totalDays, Math.max(daysPassed + 1, daysPassed + daysUntilOut));

                    Map<String, Object> meta = new LinkedHashMap<>();
                    meta.put("spentPercent", Math.round(spentPercent));
                    meta.put("dayProgressPercent", Math.round(dayProgressPercent));
                    meta.put("daysPassed", daysPassed);
                    meta.put("daysRemaining", totalDays - daysPassed);
                    meta.put("estimatedRunOutDay", estimatedRunOutDay);
                    meta.put("budgetId", budget.getId());

                    alerts.add(SpendingAlertResponse.builder()
                            .alertType(SpendingAlertType.RAPID_SPENDING)
                            .severity(AlertSeverity.HIGH)
                            .title("Chi tiêu quá nhanh trong danh mục " + categoryName)
                            .message(String.format("Bạn đã chi %.0f%% ngân sách %s nhưng mới qua %.0f%% thời gian trong tháng. Dự kiến sẽ hết ngân sách vào ngày %d.",
                                    spentPercent, categoryName, dayProgressPercent, estimatedRunOutDay))
                            .amount(spent)
                            .threshold(budgetAmount)
                            .categoryName(categoryName)
                            .categoryId(category.getId())
                            .detectedAt(nowIso)
                            .metadata(meta)
                            .build());
                } else if (spentPercent > (dayProgressPercent + 15.0) && spentPercent >= 50.0) {
                    Map<String, Object> meta = new LinkedHashMap<>();
                    meta.put("spentPercent", Math.round(spentPercent));
                    meta.put("dayProgressPercent", Math.round(dayProgressPercent));
                    meta.put("budgetId", budget.getId());

                    alerts.add(SpendingAlertResponse.builder()
                            .alertType(SpendingAlertType.BUDGET_PACE_WARNING)
                            .severity(AlertSeverity.LOW)
                            .title("Tốc độ chi tiêu " + categoryName + " hơi cao")
                            .message(String.format("Chi tiêu cho %s đang cao hơn %.0f%% so với tiến độ ngày trong tháng. Theo dõi để tránh vượt ngân sách.",
                                    categoryName, (spentPercent - dayProgressPercent)))
                            .amount(spent)
                            .threshold(budgetAmount)
                            .categoryName(categoryName)
                            .categoryId(category.getId())
                            .detectedAt(nowIso)
                            .metadata(meta)
                            .build());
                }
            }
        }

        // 3. Một danh mục có mức chi tăng đột biến (SPENDING_SPIKE)
        List<Object[]> categoryExpenses = transactionRepository.findExpenseByCategory(resolvedSpaceId, y, m);
        LocalDate startOfPrev3Months = LocalDate.of(y, m, 1).minusMonths(3);
        LocalDate endOfPrevMonth = LocalDate.of(y, m, 1).minusDays(1);

        for (Object[] row : categoryExpenses) {
            Long catId = (Long) row[0];
            String catNameEn = (String) row[1];
            String catNameVi = (String) row[2];
            String catName = (catNameVi != null && !catNameVi.isBlank()) ? catNameVi : catNameEn;
            BigDecimal currentExpense = (BigDecimal) row[5];

            if (currentExpense == null || currentExpense.compareTo(BigDecimal.valueOf(200_000)) < 0) {
                continue;
            }

            BigDecimal prev3MonthsSum = transactionRepository.sumExpenseBySpaceCategoryAndDateRange(
                    resolvedSpaceId, catId, startOfPrev3Months, endOfPrevMonth);
            if (prev3MonthsSum == null) prev3MonthsSum = BigDecimal.ZERO;

            double avgPrevMonthly = prev3MonthsSum.doubleValue() / 3.0;
            if (avgPrevMonthly >= 100_000) {
                double increase = currentExpense.doubleValue() - avgPrevMonthly;
                double increasePercent = (increase / avgPrevMonthly) * 100.0;

                if (increasePercent >= 50.0 && increase >= 200_000) {
                    Map<String, Object> meta = new LinkedHashMap<>();
                    meta.put("currentAmount", currentExpense);
                    meta.put("previousAmount", Math.round(avgPrevMonthly));
                    meta.put("increasePercent", Math.round(increasePercent * 10.0) / 10.0);

                    alerts.add(SpendingAlertResponse.builder()
                            .alertType(SpendingAlertType.SPENDING_SPIKE)
                            .severity(AlertSeverity.HIGH)
                            .title("Chi tiêu " + catName + " tăng đột biến")
                            .message(String.format("Chi tiêu cho %s tháng này tăng %.0f%% so với trung bình các tháng trước (từ %,.0f VNĐ lên %,.0f VNĐ).",
                                    catName, increasePercent, avgPrevMonthly, currentExpense.doubleValue()))
                            .amount(currentExpense)
                            .threshold(BigDecimal.valueOf(Math.round(avgPrevMonthly)))
                            .categoryName(catName)
                            .categoryId(catId)
                            .detectedAt(nowIso)
                            .metadata(meta)
                            .build());
                }
            }
        }

        // 4. Các khoản thanh toán định kỳ sắp đến hạn (RECURRING_PAYMENT_DUE)
        if (isCurrentMonth) {
            LocalDate windowStart = today;
            LocalDate windowEnd = today.plusDays(7);
            List<RecurringTransaction> upcoming = recurringTransactionRepository.findUpcomingRecurring(
                    resolvedSpaceId, windowStart, windowEnd);

            for (RecurringTransaction r : upcoming) {
                long daysRemaining = ChronoUnit.DAYS.between(today, r.getNextRunDate());
                AlertSeverity severity = daysRemaining <= 3 ? AlertSeverity.MEDIUM : AlertSeverity.LOW;
                String itemName = (r.getDescription() != null && !r.getDescription().isBlank())
                        ? r.getDescription()
                        : "Khoản thanh toán";

                String dueNotice = daysRemaining == 0 ? "hôm nay" : (daysRemaining + " ngày nữa");
                String title = (daysRemaining <= 3 ? "" : "Nhắc nhở: ") + itemName + " sắp đến hạn";
                String msg = String.format("Khoản thanh toán định kỳ \"%s\" với số tiền %,.0f VNĐ sẽ đến hạn trong %s.",
                        itemName, r.getAmount() != null ? r.getAmount().doubleValue() : 0.0, dueNotice);

                String catName = null;
                Long catId = null;
                if (r.getCategory() != null) {
                    catId = r.getCategory().getId();
                    catName = (r.getCategory().getNameVi() != null && !r.getCategory().getNameVi().isBlank())
                            ? r.getCategory().getNameVi()
                            : r.getCategory().getName();
                }

                Map<String, Object> meta = new LinkedHashMap<>();
                meta.put("daysRemaining", daysRemaining);
                meta.put("recurringTransactionId", r.getId());
                meta.put("dueDate", r.getNextRunDate().toString());

                alerts.add(SpendingAlertResponse.builder()
                        .alertType(SpendingAlertType.RECURRING_PAYMENT_DUE)
                        .severity(severity)
                        .title(title)
                        .message(msg)
                        .amount(r.getAmount())
                        .categoryName(catName)
                        .categoryId(catId)
                        .detectedAt(nowIso)
                        .metadata(meta)
                        .build());
            }
        }

        // Sắp xếp cảnh báo: CRITICAL -> HIGH -> MEDIUM -> LOW
        alerts.sort(Comparator.comparingInt(a -> {
            switch (a.getSeverity()) {
                case CRITICAL: return 1;
                case HIGH: return 2;
                case MEDIUM: return 3;
                case LOW: return 4;
                default: return 5;
            }
        }));

        // Tính điểm sức khỏe tài chính (SpendingHealthScore)
        int score = 100;
        for (SpendingAlertResponse a : alerts) {
            switch (a.getSeverity()) {
                case CRITICAL -> score -= 20;
                case HIGH -> score -= 10;
                case MEDIUM -> score -= 5;
                case LOW -> score -= 2;
            }
        }
        score = Math.max(0, Math.min(100, score));

        String level;
        String healthMessage;
        if (score >= 85) {
            level = "EXCELLENT";
            healthMessage = "Tình hình tài chính của bạn rất tốt! Tiếp tục duy trì phong độ.";
        } else if (score >= 70) {
            level = "GOOD";
            healthMessage = "Chi tiêu của bạn khá ổn định, chỉ có vài điểm cần chú ý nhẹ.";
        } else if (score >= 50) {
            level = "FAIR";
            healthMessage = "Chi tiêu của bạn cần được chú ý. Có một số vấn đề cần xử lý sớm.";
        } else if (score >= 30) {
            level = "POOR";
            healthMessage = "Cảnh báo: Bạn đang chi tiêu vượt mức ở nhiều mục, cần kiểm soát ngay!";
        } else {
            level = "CRITICAL";
            healthMessage = "Tình trạng tài chính đáng báo động! Hãy cắt giảm chi tiêu ngay lập tức.";
        }

        SpendingHealthScoreResponse healthScore = SpendingHealthScoreResponse.builder()
                .score(score)
                .level(level)
                .message(healthMessage)
                .build();

        // Đề xuất thông minh (Recommendations)
        List<SpendingRecommendationResponse> recommendations = new ArrayList<>();
        Set<String> seenTypes = new HashSet<>();

        for (SpendingAlertResponse alert : alerts) {
            String catName = alert.getCategoryName() != null ? alert.getCategoryName() : "chi tiêu";
            Long catId = alert.getCategoryId();

            if (alert.getAlertType() == SpendingAlertType.BUDGET_EXCEEDED && seenTypes.add("REDUCE_" + catName)) {
                recommendations.add(SpendingRecommendationResponse.builder()
                        .type("REDUCE_SPENDING")
                        .title("Giảm chi tiêu " + catName)
                        .description("Bạn đã vượt ngân sách " + catName + ". Hãy cắt giảm các khoản không cần thiết và cân nhắc hạn chế mua sắm trong danh mục này.")
                        .priority("HIGH")
                        .categoryId(catId)
                        .categoryName(catName)
                        .build());
            } else if (alert.getAlertType() == SpendingAlertType.SPENDING_SPIKE && seenTypes.add("ADJUST_" + catName)) {
                recommendations.add(SpendingRecommendationResponse.builder()
                        .type("ADJUST_BUDGET")
                        .title("Điều chỉnh ngân sách " + catName)
                        .description("Chi tiêu " + catName + " tăng cao đột biến. Xem xét điều chỉnh hạn mức ngân sách hoặc kiểm tra giao dịch phát sinh.")
                        .priority("MEDIUM")
                        .categoryId(catId)
                        .categoryName(catName)
                        .build());
            } else if (alert.getAlertType() == SpendingAlertType.RAPID_SPENDING && seenTypes.add("PACE_" + catName)) {
                recommendations.add(SpendingRecommendationResponse.builder()
                        .type("REDUCE_SPENDING")
                        .title("Kiểm soát tốc độ chi tiêu " + catName)
                        .description("Bạn đang tiêu ngân sách quá nhanh trong tháng. Hãy lập kế hoạch chia nhỏ ngân sách theo từng tuần còn lại.")
                        .priority("HIGH")
                        .categoryId(catId)
                        .categoryName(catName)
                        .build());
            } else if (alert.getAlertType() == SpendingAlertType.RECURRING_PAYMENT_DUE && seenTypes.add("RECURRING")) {
                recommendations.add(SpendingRecommendationResponse.builder()
                        .type("REVIEW_RECURRING")
                        .title("Kiểm tra các khoản thanh toán định kỳ")
                        .description("Đảm bảo số dư ví hoặc tài khoản ngân hàng đủ tiền để thanh toán các hóa đơn sắp đến hạn.")
                        .priority("LOW")
                        .build());
            }
        }

        if (recommendations.isEmpty()) {
            recommendations.add(SpendingRecommendationResponse.builder()
                    .type("ADJUST_BUDGET")
                    .title("Duy trì kế hoạch tài chính")
                    .description("Tất cả chi tiêu của bạn đang trong tầm kiểm soát an toàn.")
                    .priority("LOW")
                    .build());
        }

        return SpendingAnalysisResponse.builder()
                .alerts(alerts)
                .healthScore(healthScore)
                .recommendations(recommendations)
                .analysisDate(nowIso)
                .spaceId(resolvedSpaceId)
                .month(m)
                .year(y)
                .build();
    }

    @Override
    @Transactional
    public void triggerManualCheck(Long spaceId, Long userId) {
        SpendingAnalysisResponse analysis = getSpendingAnalysis(spaceId, userId, null, null);
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || analysis.getAlerts() == null) {
            return;
        }

        // Tạo thông báo trong hệ thống cho các cảnh báo mức Nghiêm trọng (CRITICAL) và Cao (HIGH)
        for (SpendingAlertResponse alert : analysis.getAlerts()) {
            if (alert.getSeverity() == AlertSeverity.CRITICAL || alert.getSeverity() == AlertSeverity.HIGH) {
                NotificationType notifType = alert.getAlertType() == SpendingAlertType.BUDGET_EXCEEDED
                        ? NotificationType.BUDGET_EXCEEDED
                        : NotificationType.BUDGET_WARNING;

                notificationRepository.save(Notification.builder()
                        .user(user)
                        .title(alert.getTitle())
                        .message(alert.getMessage())
                        .type(notifType)
                        .relatedId(alert.getCategoryId())
                        .isRead(false)
                        .build());
            }
        }
    }
}

