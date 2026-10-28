// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.repository;

import com.example.bton.entity.SavingsGoal;
import com.example.bton.enums.GoalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavingsGoalRepository extends JpaRepository<SavingsGoal, Long> {

    List<SavingsGoal> findBySpaceIdOrderByCreatedAtDesc(Long spaceId);

    List<SavingsGoal> findBySpaceIdAndStatusOrderByCreatedAtDesc(Long spaceId, GoalStatus status);

    long countBySpaceIdAndStatus(Long spaceId, GoalStatus status);
}
