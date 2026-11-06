// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.repository;

import com.example.bton.entity.SavingsGoal;
import com.example.bton.enums.GoalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavingsGoalRepository extends JpaRepository<SavingsGoal, Long> {

    List<SavingsGoal> findBySpaceIdOrderByCreatedAtDesc(Long spaceId);

    List<SavingsGoal> findBySpaceIdAndStatusOrderByCreatedAtDesc(Long spaceId, GoalStatus status);

    long countBySpaceIdAndStatus(Long spaceId, GoalStatus status);

    @Query("""
            SELECT s FROM SavingsGoal s
            WHERE s.space.id = :spaceId
            AND (:keyword IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                 OR (s.description IS NOT NULL AND LOWER(s.description) LIKE LOWER(CONCAT('%', :keyword, '%'))))
            ORDER BY s.createdAt DESC
            """)
    List<SavingsGoal> searchBySpaceAndKeyword(@Param("spaceId") Long spaceId, @Param("keyword") String keyword);
}
