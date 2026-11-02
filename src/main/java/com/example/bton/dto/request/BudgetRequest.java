// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BudgetRequest {

    private Long spaceId;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private BigDecimal amount;

    private BigDecimal limitAmount;

    private Integer month;

    private Integer year;

    @DecimalMin(value = "50", message = "Warning threshold must be at least 50%")
    @DecimalMax(value = "100", message = "Warning threshold must not exceed 100%")
    private BigDecimal warningThreshold;

    @JsonProperty("month")
    public void setMonthValue(Object val) {
        if (val == null) return;
        if (val instanceof Number n) {
            this.month = n.intValue();
        } else if (val instanceof String s) {
            String trimmed = s.trim();
            if (trimmed.contains("-")) {
                String[] parts = trimmed.split("-");
                this.year = Integer.parseInt(parts[0].trim());
                this.month = Integer.parseInt(parts[1].trim());
            } else if (!trimmed.isEmpty()) {
                this.month = Integer.parseInt(trimmed);
            }
        }
    }

    @JsonIgnore
    public BigDecimal getEffectiveAmount() {
        return amount != null ? amount : limitAmount;
    }

    @AssertTrue(message = "Amount or limitAmount must be greater than 0")
    @JsonIgnore
    public boolean isAmountValid() {
        BigDecimal val = getEffectiveAmount();
        return val != null && val.compareTo(new BigDecimal("0.01")) >= 0;
    }

    @AssertTrue(message = "Month must be between 1 and 12, and Year must be between 2020 and 2100")
    @JsonIgnore
    public boolean isMonthYearValid() {
        return month != null && month >= 1 && month <= 12 &&
               year != null && year >= 2020 && year <= 2100;
    }
}
