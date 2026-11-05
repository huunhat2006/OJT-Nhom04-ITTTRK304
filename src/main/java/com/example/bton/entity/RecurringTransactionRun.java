package com.example.bton.entity;

import com.example.bton.enums.RecurringRunStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "recurring_transaction_runs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecurringTransactionRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recurring_transaction_id", nullable = false)
    private RecurringTransaction recurringTransaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id")
    private Transaction transaction;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "executed_at", nullable = false)
    private Instant executedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RecurringRunStatus status;

    @Column(name = "error_message", length = 500)
    private String errorMessage;
}
