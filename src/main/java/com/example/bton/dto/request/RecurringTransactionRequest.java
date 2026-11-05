package com.example.bton.dto.request;

import com.example.bton.enums.RecurringFrequency;
import com.example.bton.enums.TransactionType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class RecurringTransactionRequest {

    @NotNull(message = "Space ID is required")
    private Long spaceId;

    private Long templateTransactionId;

    private Long walletId;

    private Long categoryId;

    private TransactionType type;

    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    @Digits(integer = 13, fraction = 2, message = "Amount format is invalid")
    private BigDecimal amount;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotNull(message = "Frequency is required")
    private RecurringFrequency frequency;

    @Min(value = 1, message = "Interval count must be at least 1")
    private Integer intervalCount;

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate endDate;

    private LocalDate nextRunDate;
}
