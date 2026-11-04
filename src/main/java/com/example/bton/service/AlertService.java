// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service;

import com.example.bton.dto.response.SpendingAnalysisResponse;

public interface AlertService {

    /**
     * Analyze spending patterns, budget status, spending velocity, and upcoming recurring bills.
     *
     * @param spaceId financial space ID (optional, defaults to user's personal space)
     * @param userId authenticated user ID
     * @param month target month (1-12, optional, defaults to current month)
     * @param year target year (optional, defaults to current year)
     * @return Comprehensive spending analysis including alerts, health score, and recommendations
     */
    SpendingAnalysisResponse getSpendingAnalysis(Long spaceId, Long userId, Integer month, Integer year);

    /**
     * Manually triggers spending checks and sends in-app notifications for any critical/high warnings.
     *
     * @param spaceId financial space ID
     * @param userId authenticated user ID
     */
    void triggerManualCheck(Long spaceId, Long userId);
}

