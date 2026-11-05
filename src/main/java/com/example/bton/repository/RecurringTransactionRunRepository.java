package com.example.bton.repository;

import com.example.bton.entity.RecurringTransactionRun;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RecurringTransactionRunRepository extends JpaRepository<RecurringTransactionRun, Long> {

    @EntityGraph(attributePaths = {"recurringTransaction", "recurringTransaction.user", "transaction"})
    Page<RecurringTransactionRun> findByRecurringTransactionIdOrderByExecutedAtDesc(
            Long recurringTransactionId, Pageable pageable);

    void deleteByRecurringTransactionId(Long recurringTransactionId);
}
