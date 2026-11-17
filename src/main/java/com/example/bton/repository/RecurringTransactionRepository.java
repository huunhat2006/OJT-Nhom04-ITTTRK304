// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.repository;

import com.example.bton.entity.RecurringTransaction;
import com.example.bton.enums.RecurringStatus;
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

    @Query("""
            SELECT r FROM RecurringTransaction r
            LEFT JOIN FETCH r.category
            LEFT JOIN FETCH r.wallet
            LEFT JOIN FETCH r.savingsGoal
            WHERE r.user.id = :userId
            ORDER BY r.createdAt DESC
            """)
    List<RecurringTransaction> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    @Query("""
            SELECT r FROM RecurringTransaction r
            LEFT JOIN FETCH r.category
            LEFT JOIN FETCH r.wallet
            LEFT JOIN FETCH r.savingsGoal
            WHERE r.space.id = :spaceId
            ORDER BY r.createdAt DESC
            """)
    List<RecurringTransaction> findBySpaceIdOrderByCreatedAtDesc(@Param("spaceId") Long spaceId);

    List<RecurringTransaction> findBySavingsGoalIdAndIsActiveTrue(Long savingsGoalId);

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

    @Query("""
            SELECT r FROM RecurringTransaction r
            JOIN FETCH r.user
            JOIN FETCH r.space
            LEFT JOIN FETCH r.wallet
            LEFT JOIN FETCH r.category
            LEFT JOIN FETCH r.templateTransaction
            LEFT JOIN FETCH r.savingsGoal
            WHERE r.id = :id
            """)
    Optional<RecurringTransaction> findDetailedById(@Param("id") Long id);

    @Query("""
            SELECT r FROM RecurringTransaction r
            JOIN FETCH r.user
            JOIN FETCH r.space
            LEFT JOIN FETCH r.wallet
            LEFT JOIN FETCH r.category
            LEFT JOIN FETCH r.savingsGoal
            WHERE r.status = :status
            AND r.nextRunDate IS NOT NULL
            AND r.nextRunDate <= :maxDate
            ORDER BY r.nextRunDate ASC
            """)
    List<RecurringTransaction> findDue(
            @Param("status") RecurringStatus status,
            @Param("maxDate") LocalDate maxDate);

    boolean existsByTemplateTransactionId(Long templateTransactionId);

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
