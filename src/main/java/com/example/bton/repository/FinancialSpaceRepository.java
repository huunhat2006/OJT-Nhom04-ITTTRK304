// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.repository;

import com.example.bton.entity.FinancialSpace;
import com.example.bton.enums.SpaceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FinancialSpaceRepository extends JpaRepository<FinancialSpace, Long> {

    List<FinancialSpace> findByOwnerIdAndIsActiveTrue(Long ownerId);

    List<FinancialSpace> findByOwnerIdAndTypeAndIsActiveTrue(Long ownerId, SpaceType type);

    Optional<FinancialSpace> findByIdAndIsActiveTrue(Long id);

    @Query("""
            SELECT DISTINCT fs FROM FinancialSpace fs
            LEFT JOIN fs.members fm
            WHERE fs.isActive = true
            AND (fs.owner.id = :userId OR (fm.user.id = :userId AND fm.isActive = true))
            """)
    List<FinancialSpace> findAccessibleSpaces(@Param("userId") Long userId);

    @Query("""
            SELECT DISTINCT fs FROM FinancialSpace fs
            LEFT JOIN fs.members fm
            WHERE fs.isActive = true
            AND (fs.owner.id = :userId OR (fm.user.id = :userId AND fm.isActive = true))
            AND fs.id = :spaceId
            """)
    Optional<FinancialSpace> findAccessibleSpaceById(@Param("userId") Long userId,
                                                      @Param("spaceId") Long spaceId);

    Page<FinancialSpace> findAll(Pageable pageable);

    long countByType(SpaceType type);

    Optional<FinancialSpace> findByInviteCodeAndIsActiveTrue(String inviteCode);

    Optional<FinancialSpace> findFirstByOwnerIdAndTypeAndIsActiveTrue(Long ownerId, SpaceType type);
}
