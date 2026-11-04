// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryReportResponse {
    private String category;
    private Long categoryId;
    private String categoryName;
    private String categoryNameVi;
    private String icon;
    private String color;
    private BigDecimal totalAmount;
    private BigDecimal percentage;
}
