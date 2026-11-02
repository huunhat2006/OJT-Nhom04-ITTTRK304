// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class SavingsGoalRequest {

    @NotNull(message = "Space ID is required")
    private Long spaceId;

    @NotBlank(message = "Goal name is required")
    @Size(max = 200, message = "Goal name must not exceed 200 characters")
    private String name;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotNull(message = "Target amount is required")
    @DecimalMin(value = "0.01", message = "Target amount must be greater than 0")
    @Digits(integer = 13, fraction = 2, message = "Amount format is invalid")
    private BigDecimal targetAmount;

    @DecimalMin(value = "0", message = "Initial amount cannot be negative")
    private BigDecimal initialAmount;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate deadline;

    @Size(max = 100)
    private String icon;

    @Size(max = 20)
    private String color;
}
