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

    List<RecurringTransaction> findBySpaceIdOrderByCreatedAtDesc(Long spaceId);

    @Query("""
            SELECT r FROM RecurringTransaction r
            LEFT JOIN FETCH r.category
            WHERE r.space.id = :spaceId
            AND r.isActive = true
            AND r.nextRunDate IS NOT NULL
            AND r.nextRunDate >= :fromDate
            AND r.nextRunDate <= :toDate
            ORDER BY r.nextRunDate ASC
            """)
    List<RecurringTransaction> findUpcomingRecurring(
            @Param("spaceId") Long spaceId,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);

    List<RecurringTransaction> findByWalletIdOrderByCreatedAtDesc(Long walletId);

    List<RecurringTransaction> findByIsActiveTrueOrderByNextRunDateAsc();

    Optional<RecurringTransaction> findTopByUserIdAndIsActiveTrueOrderByNextRunDateAsc(Long userId);

    @Modifying
    @Query("""
            UPDATE RecurringTransaction r
            SET r.lastRunDate = :executedOn,
                r.nextRunDate = :nextRunDate
            WHERE r.id = :id
            """)
    void markExecuted(@Param("id") Long id,
                      @Param("executedOn") LocalDate executedOn,
                      @Param("nextRunDate") LocalDate nextRunDate);

    @Modifying
    @Query("UPDATE RecurringTransaction r SET r.isActive = false WHERE r.nextRunDate < CURRENT_DATE AND r.isActive = true")
    void archiveOverdueRecurring();
}
