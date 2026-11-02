// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.repository;

import com.example.bton.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findBySpaceIdAndBudgetMonthAndBudgetYear(Long spaceId, int month, int year);

    Optional<Budget> findBySpaceIdAndCategoryIdAndBudgetMonthAndBudgetYear(Long spaceId, Long categoryId,
                                                                           int month, int year);

    List<Budget> findBySpaceId(Long spaceId);

    boolean existsBySpaceIdAndCategoryIdAndBudgetMonthAndBudgetYear(Long spaceId, Long categoryId,
                                                                     int month, int year);

    @Query("""
            SELECT b FROM Budget b
            JOIN FETCH b.category
            WHERE b.space.id = :spaceId
            AND b.budgetMonth = :month AND b.budgetYear = :year
            ORDER BY b.category.name ASC
            """)
    List<Budget> findBySpaceAndMonthWithCategory(@Param("spaceId") Long spaceId,
                                                  @Param("month") int month,
                                                  @Param("year") int year);
}
