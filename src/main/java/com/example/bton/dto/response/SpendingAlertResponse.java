// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.response;

import com.example.bton.enums.AlertSeverity;
import com.example.bton.enums.SpendingAlertType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpendingAlertResponse {
    private SpendingAlertType alertType;
    private AlertSeverity severity;
    private String title;
    private String message;
    private BigDecimal amount;
    private BigDecimal threshold;
    private String categoryName;
    private Long categoryId;
    private String detectedAt;
    private Map<String, Object> metadata;
}

