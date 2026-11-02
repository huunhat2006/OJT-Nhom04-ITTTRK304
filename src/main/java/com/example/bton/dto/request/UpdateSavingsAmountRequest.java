// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateSavingsAmountRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0", message = "Amount cannot be negative")
    @Digits(integer = 13, fraction = 2, message = "Amount format is invalid")
    private BigDecimal amount;
}
