// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.repository;

import com.example.bton.entity.FamilyMember;
import com.example.bton.enums.FamilyRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FamilyMemberRepository extends JpaRepository<FamilyMember, Long> {

    List<FamilyMember> findBySpaceIdAndIsActiveTrue(Long spaceId);

    Optional<FamilyMember> findBySpaceIdAndUserIdAndIsActiveTrue(Long spaceId, Long userId);

    boolean existsBySpaceIdAndUserIdAndIsActiveTrue(Long spaceId, Long userId);

    @Query("""
            SELECT fm FROM FamilyMember fm
            WHERE fm.space.id = :spaceId AND fm.user.id = :userId AND fm.isActive = true
            """)
    Optional<FamilyMember> findMembership(@Param("spaceId") Long spaceId,
                                          @Param("userId") Long userId);

    @Query("""
            SELECT CASE WHEN COUNT(fm) > 0 THEN true ELSE false END
            FROM FamilyMember fm
            WHERE fm.space.id = :spaceId AND fm.user.id = :userId
            AND fm.isActive = true AND fm.role IN ('OWNER', 'ADMIN', 'MEMBER')
            """)
    boolean hasWriteAccess(@Param("spaceId") Long spaceId, @Param("userId") Long userId);

    @Query("""
            SELECT fm.role FROM FamilyMember fm
            WHERE fm.space.id = :spaceId AND fm.user.id = :userId AND fm.isActive = true
            """)
    Optional<FamilyRole> findRoleBySpaceIdAndUserId(@Param("spaceId") Long spaceId,
                                                     @Param("userId") Long userId);

    Optional<FamilyMember> findBySpaceIdAndUserId(Long spaceId, Long userId);
}
