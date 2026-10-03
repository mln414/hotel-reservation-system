package com.lankastay.backend.repository;

import com.lankastay.backend.entity.SecurityAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SecurityAuditRepository extends JpaRepository<SecurityAudit, Long> {
    List<SecurityAudit> findTop10ByOrderByOccurredAtDesc();
}
