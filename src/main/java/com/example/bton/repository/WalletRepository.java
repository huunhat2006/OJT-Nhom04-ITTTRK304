// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.repository;

import com.example.bton.entity.Wallet;
import com.example.bton.enums.WalletType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long> {

    @Query("""
            SELECT w FROM Wallet w
            WHERE w.user.id = :userId
            AND w.isActive = true
            ORDER BY w.createdAt DESC
            """)
    List<Wallet> findByUserIdAndIsActiveTrue(@Param("userId") Long userId);

    @Query("""
            SELECT w FROM Wallet w
            WHERE w.space.id = :spaceId
            AND w.isActive = true
            ORDER BY w.createdAt DESC
            """)
    List<Wallet> findBySpaceIdAndIsActiveTrue(@Param("spaceId") Long spaceId);

    @Query("""
            SELECT w FROM Wallet w
            WHERE w.walletType = :walletType
            AND w.user.id = :userId
            AND w.isActive = true
            """)
    List<Wallet> findByTypeAndUser(@Param("walletType") WalletType walletType, @Param("userId") Long userId);

    @Query("""
            SELECT w FROM Wallet w
            WHERE w.isShared = true
            AND w.space.id = :spaceId
            AND w.isActive = true
            """)
    List<Wallet> findSharedWalletsBySpace(@Param("spaceId") Long spaceId);

    @Query("""
            SELECT w FROM Wallet w
            WHERE w.space.id = :spaceId
            AND w.user.id = :userId
            AND w.isActive = true
            """)
    Optional<Wallet> findBySpaceIdAndUserId(@Param("spaceId") Long spaceId, @Param("userId") Long userId);

    @Query("""
            SELECT w FROM Wallet w
            WHERE w.balance < :minBalance
            AND w.isActive = true
            """)
    List<Wallet> findLowBalanceWallets(@Param("minBalance") BigDecimal minBalance);

    @Query("SELECT COUNT(w) FROM Wallet w WHERE w.id = :walletId")
    long countByWalletId(@Param("walletId") Long walletId);
}
