// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.response;

import com.example.bton.enums.CategoryType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryResponse {
    private Long id;
    private String name;
    private String nameVi;
    private CategoryType type;
    private String icon;
    private String color;
    private Boolean isSystem;
    private Integer displayOrder;
}
