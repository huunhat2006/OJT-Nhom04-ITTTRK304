// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.repository;

import com.example.bton.entity.User;
import com.example.bton.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsernameOrEmail(String username, String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    long countByRole(Role role);

    long countByIsActive(Boolean isActive);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :since AND u.role = 'USER'")
    long countNewUsersSince(@Param("since") LocalDateTime since);

    @Query("""
            SELECT u FROM User u
            WHERE (:keyword IS NULL OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')))
            AND (:role IS NULL OR u.role = :role)
            AND (:isActive IS NULL OR u.isActive = :isActive)
            """)
    Page<User> searchUsers(@Param("keyword") String keyword,
                           @Param("role") Role role,
                           @Param("isActive") Boolean isActive,
                           Pageable pageable);

    @Query("SELECT u.createdAt FROM User u WHERE u.id = :id")
    Optional<LocalDateTime> findCreatedAtById(@Param("id") Long id);

    @Query("""
            SELECT YEAR(u.createdAt) as year, MONTH(u.createdAt) as month, COUNT(u) as count
            FROM User u
            WHERE u.role = 'USER' AND u.createdAt >= :since
            GROUP BY YEAR(u.createdAt), MONTH(u.createdAt)
            ORDER BY year, month
            """)
    java.util.List<Object[]> countUserRegistrationsByMonth(@Param("since") LocalDateTime since);
}
