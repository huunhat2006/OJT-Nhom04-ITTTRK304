// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class AdminDashboardResponse {
    private long totalUsers;
    private long activeUsers;
    private long totalSpaces;
    private long familySpaces;
    private long totalTransactionsThisMonth;
    private long newUsersThisMonth;
    private List<Map<String, Object>> userRegistrationTrend;
    private List<Map<String, Object>> transactionTrend;
}
