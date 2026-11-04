// Tác giả: Nguyễn Hoàng Phúc (Frontend Lead & UI/UX)
package com.example.bton.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class SavingsGoalTransactionRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Digits(integer = 13, fraction = 2, message = "Amount format is invalid")
    private BigDecimal amount;

    private Long walletId;

    @Size(max = 500, message = "Note must not exceed 500 characters")
    private String note;
}
