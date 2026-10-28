// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.repository;

import com.example.bton.entity.Category;
import com.example.bton.enums.CategoryType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Query("""
            SELECT c FROM Category c
            WHERE c.isActive = true
            AND (c.isSystem = true OR c.user.id = :userId)
            ORDER BY c.isSystem DESC, c.displayOrder ASC, c.name ASC
            """)
    List<Category> findAvailableForUser(@Param("userId") Long userId);

    @Query("""
            SELECT c FROM Category c
            WHERE c.isActive = true
            AND (c.isSystem = true OR c.user.id = :userId)
            AND (c.type = :type OR c.type = 'BOTH')
            ORDER BY c.isSystem DESC, c.displayOrder ASC, c.name ASC
            """)
    List<Category> findAvailableForUserByType(@Param("userId") Long userId,
                                               @Param("type") CategoryType type);

    List<Category> findByIsSystemTrue();

    List<Category> findByIsSystemTrueAndIsActiveTrue();

    List<Category> findByUserIdAndIsActiveTrue(Long userId);

    boolean existsByNameAndUserIdAndIsActiveTrue(String name, Long userId);

    java.util.Optional<Category> findFirstByNameAndTypeAndIsSystemTrueAndIsActiveTrue(
            String name, CategoryType type);
}
