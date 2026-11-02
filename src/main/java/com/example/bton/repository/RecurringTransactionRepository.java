// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.repository;

import com.example.bton.entity.RecurringTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction, Long> {

    List<RecurringTransaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<RecurringTransaction> findByFamilyIdOrderByCreatedAtDesc(Long familyId);

    List<RecurringTransaction> findByWalletIdOrderByCreatedAtDesc(Long walletId);

    List<RecurringTransaction> findByIsActiveTrueOrderByNextTriggerDateAsc();

    Optional<RecurringTransaction> findTopByUserIdAndIsActiveTrueOrderByNextTriggerDateAsc(Long userId);

    @Modifying
    @Query("UPDATE RecurringTransaction r SET r.timesExecuted = r.timesExecuted + 1, r.lastExecutedDate = CURRENT_DATE WHERE r.id = :id")
    void incrementExecutionCount(@Param("id") Long id);

    @Modifying
    @Query("UPDATE RecurringTransaction r SET r.isActive = false WHERE r.nextTriggerDate < CURRENT_DATE AND r.is_active = true")
    void archiveOverdueRecurring();
}