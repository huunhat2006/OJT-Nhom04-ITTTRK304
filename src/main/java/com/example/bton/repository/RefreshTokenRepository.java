// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.repository;

import com.example.bton.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    @Query("""
            SELECT r FROM RefreshToken r
            WHERE r.user.id = :userId
            AND r.isRevoked = false
            AND r.expiryDate > :now
            """)
    Optional<RefreshToken> findValidByUserIdAndExpiry(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    @Query("""
            SELECT r FROM RefreshToken r
            WHERE r.token = :token
            AND r.isRevoked = false
            """)
    Optional<RefreshToken> findByToken(@Param("token") String token);

    @Modifying
    @Query("""
            DELETE FROM RefreshToken r
            WHERE r.user.id = :userId
            """)
    void deleteByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("""
            UPDATE RefreshToken r
            SET r.isRevoked = true
            WHERE r.user.id = :userId
            """)
    void revokeByUserId(@Param("userId") Long userId);
}