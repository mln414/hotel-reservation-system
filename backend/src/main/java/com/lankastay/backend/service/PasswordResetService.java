package com.lankastay.backend.service;

import com.lankastay.backend.dto.auth.*;
import com.lankastay.backend.entity.*;
import com.lankastay.backend.exception.ApiException;
import com.lankastay.backend.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.LoggerFactory;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.Instant;
import java.util.*;

@Service
public class PasswordResetService {
    private static final String GENERIC_RESPONSE = "If an account exists for that email, password reset instructions have been sent.";
    private final StaffUserRepository staffRepository;
    private final CustomerUserRepository customerRepository;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder encoder;
    private final PasswordPolicy policy;
    private final SecurityAuditService audit;
    private final SessionRevocationService sessions;
    private final EmailService emailService;
    private final ResetRequestRateLimiter limiter;
    private final String frontendUrl;
    private final SecureRandom random = new SecureRandom();

    public PasswordResetService(StaffUserRepository staffRepository, CustomerUserRepository customerRepository,
            PasswordResetTokenRepository tokens, PasswordEncoder encoder, PasswordPolicy policy,
            SecurityAuditService audit, SessionRevocationService sessions, EmailService emailService,
            ResetRequestRateLimiter limiter, @Value("${lankastay.frontend-url:http://localhost:5174}") String frontendUrl) {
        this.staffRepository = staffRepository;
        this.customerRepository = customerRepository;
        this.tokens = tokens;
        this.encoder = encoder;
        this.policy = policy;
        this.audit = audit;
        this.sessions = sessions;
        this.emailService = emailService;
        this.limiter = limiter;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    @Transactional
    public String requestPasswordReset(ForgotPasswordRequest request, String ip, boolean customerFlow) {
        if (!limiter.allow(ip)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", "Too many reset requests. Please try again later.");
        }
        String email = CustomerUser.normalizeEmail(request.email());
        // Match lookup count and cryptographic work for existing and absent accounts.
        StaffUser staff = customerFlow ? null : staffRepository.findByEmail(email).orElse(null);
        CustomerUser customer = customerFlow ? customerRepository.findByEmail(email).orElse(null) : null;
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        String hash = hashToken(raw);
        UUID id = staff != null ? staff.getId() : customer != null ? customer.getId() : null;
        audit.record(null, id, SecurityEventType.PASSWORD_RESET_REQUESTED, ip, "GENERIC_OK");
        if (id == null) return GENERIC_RESPONSE;
        PasswordResetToken token = new PasswordResetToken();
        token.setTokenHash(hash);
        token.setExpiresAt(Instant.now().plusSeconds(1800));
        if (customerFlow) {
            tokens.deleteByCustomerUserId(id);
            token.setCustomerUserId(id);
        } else {
            tokens.deleteByStaffUserId(id);
            token.setStaffUserId(id);
        }
        tokens.saveAndFlush(token);
        // Delivery failure never discloses account existence or a token to HTTP clients.
        try {
            emailService.sendPasswordReset(email, frontendUrl + (customerFlow ? "/reset-password?token=" : "/staff/reset-password?token=") + raw);
        } catch (RuntimeException deliveryFailure) {
            LoggerFactory.getLogger(getClass()).warn("Password reset delivery unavailable; check private mail configuration.");
        }
        return GENERIC_RESPONSE;
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request, String ip, boolean customerFlow) {
        if (!request.newPassword().equals(request.confirmNewPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation Error", "New password and confirmation do not match.");
        }
        policy.validate(request.newPassword());
        PasswordResetToken token = tokens.findByTokenHashAndUsedAtIsNull(hashToken(request.token())).orElseThrow(() -> {
            audit.record(null, null, SecurityEventType.PASSWORD_RESET_FAILED, ip, "INVALID_TOKEN");
            return invalid();
        });
        boolean correctScope = customerFlow
                ? token.getCustomerUserId() != null && token.getStaffUserId() == null
                : token.getStaffUserId() != null && token.getCustomerUserId() == null;
        if (!correctScope || token.isExpired() || token.isUsed()) {
            audit.record(null, null, SecurityEventType.PASSWORD_RESET_FAILED, ip, "INVALID_TOKEN");
            throw invalid();
        }
        UUID id;
        if (customerFlow) {
            CustomerUser customer = customerRepository.findById(token.getCustomerUserId()).orElseThrow(this::invalid);
            if (encoder.matches(request.newPassword(), customer.getPasswordHash())) throw samePassword();
            customer.setPasswordHash(encoder.encode(request.newPassword()));
            customer.setFailedLoginAttempts(0);
            customer.setLockedUntil(null);
            customer.revokeSessions();
            customerRepository.save(customer);
            id = customer.getId();
        } else {
            StaffUser staff = staffRepository.findById(token.getStaffUserId()).orElseThrow(this::invalid);
            if (encoder.matches(request.newPassword(), staff.getPasswordHash())) throw samePassword();
            staff.setPasswordHash(encoder.encode(request.newPassword()));
            staff.setMustChangePassword(false);
            staff.setFailedLoginAttempts(0);
            staff.setLockedUntil(null);
            staffRepository.save(staff);
            sessions.revokeAll(staff.getEmail());
            id = staff.getId();
        }
        token.setUsedAt(Instant.now());
        tokens.save(token);
        // Requests invalidate previous tokens; revoke any other outstanding account tokens too.
        for (PasswordResetToken other : (customerFlow ? tokens.findByCustomerUserId(id) : tokens.findByStaffUserId(id))) {
            if (other.getUsedAt() == null) other.setUsedAt(token.getUsedAt());
        }
        audit.record(id, id, SecurityEventType.PASSWORD_RESET_COMPLETED, ip, "SUCCESS");
    }

    private ApiException invalid() {
        return new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Password reset token is invalid, expired, or has already been used.");
    }
    private ApiException samePassword() {
        return new ApiException(HttpStatus.BAD_REQUEST, "Validation Error", "New password must be different from current password.");
    }
    private String hashToken(String raw) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
}
