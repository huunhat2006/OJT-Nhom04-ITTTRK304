package com.example.bton.dto.response;

import com.example.bton.enums.RecurringFrequency;
import com.example.bton.enums.RecurringStatus;
import com.example.bton.enums.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class RecurringTransactionResponse {
    private Long id;
    private Long userId;
    private String userName;
    private Long spaceId;
    private String spaceName;
    private Long templateTransactionId;
    private Long walletId;
    private String walletName;
    private CategoryResponse category;
    private TransactionType type;
    private BigDecimal amount;
    private String description;
    private RecurringFrequency frequency;
    private Integer intervalCount;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate nextRunDate;
    private LocalDate lastRunDate;
    private RecurringStatus status;
    private Boolean isActive;
    private String timezone;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
