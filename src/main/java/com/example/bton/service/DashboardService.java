// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.service;

import com.example.bton.dto.response.DashboardSummaryResponse;
import com.example.bton.dto.response.TopExpenseCategoryResponse;

import java.util.List;

public interface DashboardService {
    DashboardSummaryResponse getSummary(Long spaceId, Long userId, Integer month, Integer year);
    List<TopExpenseCategoryResponse> getTopExpenses(Long spaceId, Long userId, Integer month, Integer year);
}
