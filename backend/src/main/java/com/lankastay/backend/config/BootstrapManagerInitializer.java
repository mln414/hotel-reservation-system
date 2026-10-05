package com.lankastay.backend.config;

import com.lankastay.backend.entity.StaffRole;
import com.lankastay.backend.entity.StaffStatus;
import com.lankastay.backend.entity.StaffUser;
import com.lankastay.backend.repository.StaffUserRepository;
import com.lankastay.backend.service.PasswordPolicy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class BootstrapManagerInitializer implements ApplicationRunner {
    private final StaffUserRepository users;
    private final PasswordEncoder encoder;
    private final PasswordPolicy policy;
    private final String email;
    private final String temporaryPassword;

    public BootstrapManagerInitializer(StaffUserRepository users, PasswordEncoder encoder, PasswordPolicy policy,
            @Value("${lankastay.security.bootstrap-admin-email:}") String email,
            @Value("${lankastay.security.bootstrap-admin-temp-password:}") String temporaryPassword) {
        this.users = users;
        this.encoder = encoder;
        this.policy = policy;
        this.email = email;
        this.temporaryPassword = temporaryPassword;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (email.isBlank() || temporaryPassword.isBlank()) return;
        String normalizedEmail = StaffUser.normalizeEmail(email);
        if (!StaffUser.isValidEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Initial manager email is invalid.");
        }
        // Never overwrite an existing credential. This makes bootstrap safe across restarts.
        if (users.existsByEmail(normalizedEmail)) return;
        policy.validate(temporaryPassword);
        StaffUser manager = new StaffUser();
        manager.setEmail(normalizedEmail);
        manager.setFirstName("Bootstrap");
        manager.setLastName("Manager");
        manager.setRole(StaffRole.MANAGER);
        manager.setStatus(StaffStatus.ACTIVE);
        manager.setMustChangePassword(true);
        // Security: bootstrap credentials come only from the environment and the raw value is never logged.
        manager.setPasswordHash(encoder.encode(temporaryPassword));
        users.save(manager);
    }
}
