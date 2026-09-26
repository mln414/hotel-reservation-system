package com.lankastay.backend.repository;

import com.lankastay.backend.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    Optional<PasswordResetToken> findByTokenHashAndUsedAtIsNull(String tokenHash);
    void deleteByStaffUserId(UUID staffUserId);
    void deleteByCustomerUserId(UUID customerUserId);
    java.util.List<PasswordResetToken> findByCustomerUserId(UUID customerUserId);
    java.util.List<PasswordResetToken> findByStaffUserId(UUID staffUserId);
}
