package com.example.bton.dto.response;

import com.example.bton.enums.RecurringRunStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
public class RecurringTransactionRunResponse {
    private Long id;
    private Long recurringTransactionId;
    private Long transactionId;
    private LocalDate scheduledDate;
    private Instant executedAt;
    private String executedAtLocal;
    private String timezone;
    private RecurringRunStatus status;
    private String errorMessage;
}
