package com.lankastay.backend.service;

import com.lankastay.backend.dto.auth.ChangeInitialPasswordRequest;
import com.lankastay.backend.dto.auth.ChangePasswordRequest;
import com.lankastay.backend.dto.auth.StaffLoginRequest;
import com.lankastay.backend.entity.*;
import com.lankastay.backend.exception.ApiException;
import com.lankastay.backend.repository.StaffUserRepository;
import com.lankastay.backend.security.StaffPrincipal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class AuthenticationService {
    public record AuthenticatedLogin(Authentication authentication, StaffUser user) {}

    private final StaffUserRepository users;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder encoder;
    private final PasswordPolicy passwordPolicy;
    private final LoginRateLimiter rateLimiter;
    private final SecurityAuditService audit;
    private final SessionRevocationService sessions;
    private final int maxFailedAttempts;
    private final Duration lockoutDuration;

    public AuthenticationService(StaffUserRepository users, AuthenticationManager authenticationManager,
                                 PasswordEncoder encoder, PasswordPolicy passwordPolicy, LoginRateLimiter rateLimiter,
                                 SecurityAuditService audit, SessionRevocationService sessions,
                                 @Value("${lankastay.security.max-failed-attempts:5}") int maxFailedAttempts,
                                 @Value("${lankastay.security.lockout-duration:15m}") Duration lockoutDuration) {
        this.users = users;
        this.authenticationManager = authenticationManager;
        this.encoder = encoder;
        this.passwordPolicy = passwordPolicy;
        this.rateLimiter = rateLimiter;
        this.audit = audit;
        this.sessions = sessions;
        this.maxFailedAttempts = maxFailedAttempts;
        this.lockoutDuration = lockoutDuration;
    }

    @Transactional(noRollbackFor = ApiException.class)
    public AuthenticatedLogin login(StaffLoginRequest request, String ip) {
        if (!rateLimiter.allow(ip)) {
            audit.record(null, null, SecurityEventType.LOGIN_FAILURE, ip, "RATE_LIMITED");
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", "Too many login attempts. Please try again later.");
        }
        String email = StaffUser.normalizeEmail(request.email());
        if (!StaffUser.isValidEmail(email)) {
            audit.record(null, null, SecurityEventType.LOGIN_FAILURE, ip, "INVALID_CREDENTIALS");
            throw invalidCredentials();
        }
        StaffUser user = users.findByEmail(email).orElse(null);
        if (user != null && user.getLockedUntil() != null && !user.getLockedUntil().isAfter(Instant.now())) {
            user.setLockedUntil(null);
            user.setFailedLoginAttempts(0);
        }
        if (user != null && (user.getStatus() != StaffStatus.ACTIVE ||
                (user.getLockedUntil() != null && user.getLockedUntil().isAfter(Instant.now())))) {
            audit.record(null, user.getId(), SecurityEventType.LOGIN_FAILURE, ip, "DENIED");
            throw invalidCredentials();
        }
        try {
            Authentication authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(email, request.password()));
            user = users.findByEmail(email).orElseThrow();
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            user.setLastLoginAt(Instant.now());
            users.save(user);
            rateLimiter.clear(ip);
            audit.record(user.getId(), user.getId(), SecurityEventType.LOGIN_SUCCESS, ip, "SUCCESS");
            return new AuthenticatedLogin(authentication, user);
        } catch (AuthenticationException exception) {
            if (user != null) registerFailure(user, ip);
            else audit.record(null, null, SecurityEventType.LOGIN_FAILURE, ip, "INVALID_CREDENTIALS");
            // Security: the same response is used for unknown emails and incorrect passwords.
            throw invalidCredentials();
        }
    }

    private void registerFailure(StaffUser user, String ip) {
        int failures = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(failures);
        if (failures >= maxFailedAttempts) {
            int multiplier = Math.min(4, Math.max(1, failures / maxFailedAttempts));
            user.setLockedUntil(Instant.now().plus(lockoutDuration.multipliedBy(multiplier)));
            audit.record(null, user.getId(), SecurityEventType.ACCOUNT_LOCKED, ip, "TEMPORARY_LOCK");
        }
        users.save(user);
        audit.record(null, user.getId(), SecurityEventType.LOGIN_FAILURE, ip, "INVALID_CREDENTIALS");
    }

    private ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "Invalid email or password.");
    }

    @Transactional
    public StaffUser changeInitialPassword(UUID userId, ChangeInitialPasswordRequest request, String ip) {
        StaffUser user = requireActive(userId);
        if (!user.isMustChangePassword()) {
            throw new ApiException(HttpStatus.CONFLICT, "Conflict", "Initial password change is not required.");
        }
        if (!encoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Current password is incorrect.");
        }
        validateNewPassword(request.newPassword(), request.confirmNewPassword(), user);
        user.setPasswordHash(encoder.encode(request.newPassword()));
        user.setMustChangePassword(false);
        users.save(user);
        audit.record(userId, userId, SecurityEventType.INITIAL_PASSWORD_CHANGED, ip, "SUCCESS");
        return user;
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request, String ip, String currentSessionId) {
        StaffUser user = requireActive(userId);
        if (user.isMustChangePassword()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "Initial password change is required.");
        }
        if (!encoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Current password is incorrect.");
        }
        validateNewPassword(request.newPassword(), request.confirmNewPassword(), user);
        user.setPasswordHash(encoder.encode(request.newPassword()));
        users.save(user);
        sessions.revokeOther(user.getEmail(), currentSessionId);
        audit.record(userId, userId, SecurityEventType.PASSWORD_CHANGED, ip, "SUCCESS");
    }

    private void validateNewPassword(String password, String confirmation, StaffUser user) {
        if (!password.equals(confirmation)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation Error", "New password and confirmation do not match.");
        }
        passwordPolicy.validate(password);
        if (encoder.matches(password, user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation Error", "New password must be different from the current password.");
        }
    }

    public StaffUser requireActive(UUID id) {
        StaffUser user = users.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "Authentication is required."));
        if (user.getStatus() != StaffStatus.ACTIVE) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "Authentication is required.");
        }
        return user;
    }

}
