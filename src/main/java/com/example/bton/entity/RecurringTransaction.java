// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.entity;

import com.example.bton.enums.RecurringFrequency;
import com.example.bton.enums.RecurringStatus;
import com.example.bton.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "recurring_transactions")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecurringTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "space_id", nullable = false)
    private FinancialSpace space;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_transaction_id")
    private Transaction templateTransaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id")
    private Wallet wallet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionType type;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RecurringFrequency frequency = RecurringFrequency.MONTHLY;

    @Column(name = "interval_count", nullable = false)
    @Builder.Default
    private Integer intervalCount = 1;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "next_run_date")
    private LocalDate nextRunDate;

    @Column(name = "last_run_date")
    private LocalDate lastRunDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RecurringStatus status = RecurringStatus.ACTIVE;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
