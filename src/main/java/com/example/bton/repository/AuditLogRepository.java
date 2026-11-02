// Tác giả: Trần Hữu Nhật (Backend & DevOps Lead)
package com.example.bton.repository;

import com.example.bton.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<AuditLog> findByAdminIdOrderByCreatedAtDesc(Long adminId, Pageable pageable);

    @Query("""
            SELECT al FROM AuditLog al
            WHERE (:adminId IS NULL OR al.admin.id = :adminId)
            AND (:action IS NULL OR al.action = :action)
            ORDER BY al.createdAt DESC
            """)
    Page<AuditLog> searchLogs(@Param("adminId") Long adminId,
                               @Param("action") String action,
                               Pageable pageable);
}
