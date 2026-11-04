// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetStatusResponse {

    private List<BudgetStatusItem> budgetList;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BudgetStatusItem {
        private Long id;
        private CategoryResponse category;
        private BigDecimal limit;
        private BigDecimal spent;
        private BigDecimal percent;
        private String status; // OK, WARNING, EXCEEDED
    }
}

