package com.lankastay.backend.service;

import com.lankastay.backend.dto.auth.CustomerLoginRequest;
import com.lankastay.backend.dto.auth.CustomerRegisterRequest;
import com.lankastay.backend.dto.auth.CustomerResponse;
import com.lankastay.backend.entity.CustomerUser;
import com.lankastay.backend.entity.SecurityEventType;
import com.lankastay.backend.exception.ApiException;
import com.lankastay.backend.repository.CustomerUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class CustomerAuthenticationService {

    private final CustomerUserRepository customerRepository;
    private final PasswordEncoder encoder;
    private final PasswordPolicy passwordPolicy;
    private final SecurityAuditService audit;

    public CustomerAuthenticationService(CustomerUserRepository customerRepository, PasswordEncoder encoder,
                                         PasswordPolicy passwordPolicy, SecurityAuditService audit) {
        this.customerRepository = customerRepository;
        this.encoder = encoder;
        this.passwordPolicy = passwordPolicy;
        this.audit = audit;
    }

    @Transactional
    public CustomerResponse register(CustomerRegisterRequest request, String ipAddress) {
        String normalizedEmail = CustomerUser.normalizeEmail(request.email());
        if (customerRepository.existsByEmail(normalizedEmail)) {
            audit.record(null, null, SecurityEventType.LOGIN_FAILURE, ipAddress, "DUPLICATE_EMAIL");
            throw new ApiException(HttpStatus.CONFLICT, "Conflict", "An account already exists for this email address.");
        }

        passwordPolicy.validate(request.password());

        CustomerUser customer = new CustomerUser();
        customer.setEmail(normalizedEmail);
        customer.setFirstName(request.firstName().trim());
        customer.setLastName(request.lastName().trim());
        if (request.phone() != null) {
            customer.setPhone(request.phone().trim());
        }
        customer.setPasswordHash(encoder.encode(request.password()));
        customer.setRole("CUSTOMER"); // Security: Enforce CUSTOMER role; ignore any client role assignment attempts
        customer.setStatus("ACTIVE");

        CustomerUser saved = customerRepository.save(customer);

        audit.record(saved.getId(), saved.getId(), SecurityEventType.CUSTOMER_REGISTERED, ipAddress, "SUCCESS");

        return CustomerResponse.from(saved);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public CustomerUser login(CustomerLoginRequest request, String ipAddress) {
        String normalizedEmail = CustomerUser.normalizeEmail(request.email());
        CustomerUser customer = customerRepository.findByEmail(normalizedEmail).orElse(null);

        if (customer != null && customer.getLockedUntil() != null && !customer.getLockedUntil().isAfter(Instant.now())) {
            customer.setLockedUntil(null);
            customer.setFailedLoginAttempts(0);
        }

        if (customer == null || !"ACTIVE".equals(customer.getStatus()) ||
                (customer.getLockedUntil() != null && customer.getLockedUntil().isAfter(Instant.now()))) {
            audit.record(null, customer != null ? customer.getId() : null, SecurityEventType.LOGIN_FAILURE, ipAddress, "DENIED");
            throw invalidCredentials();
        }

        if (!encoder.matches(request.password(), customer.getPasswordHash())) {
            int failures = customer.getFailedLoginAttempts() + 1;
            customer.setFailedLoginAttempts(failures);
            if (failures >= 5) {
                customer.setLockedUntil(Instant.now().plusSeconds(900)); // 15 min lock
                audit.record(null, customer.getId(), SecurityEventType.ACCOUNT_LOCKED, ipAddress, "TEMPORARY_LOCK");
            }
            customerRepository.save(customer);
            audit.record(null, customer.getId(), SecurityEventType.LOGIN_FAILURE, ipAddress, "INVALID_CREDENTIALS");
            throw invalidCredentials();
        }

        customer.setFailedLoginAttempts(0);
        customer.setLockedUntil(null);
        customer.setLastLoginAt(Instant.now());
        customerRepository.save(customer);

        audit.record(customer.getId(), customer.getId(), SecurityEventType.LOGIN_SUCCESS, ipAddress, "SUCCESS");
        return customer;
    }

    @Transactional(readOnly = true)
    public CustomerUser requireActive(UUID id) {
        CustomerUser customer = customerRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "Authentication is required."));
        if (!"ACTIVE".equals(customer.getStatus())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "Account is inactive.");
        }
        return customer;
    }


    @Transactional
    public CustomerResponse updateProfile(UUID customerId, com.lankastay.backend.dto.auth.UpdateCustomerProfileRequest request, String ipAddress) {
        CustomerUser customer = requireActive(customerId);

        if (request.email() != null && !request.email().isBlank()) {
            String normalized = CustomerUser.normalizeEmail(request.email());
            if (!normalized.equalsIgnoreCase(customer.getEmail())) {
                if (customerRepository.existsByEmail(normalized)) {
                    throw new ApiException(HttpStatus.CONFLICT, "Conflict", "An account already exists for this email address.");
                }
                customer.setEmail(normalized);
            }
        }

        customer.setFirstName(request.firstName().trim());
        customer.setLastName(request.lastName().trim());
        if (request.phone() != null) {
            customer.setPhone(request.phone().trim());
        } else {
            customer.setPhone(null);
        }

        CustomerUser saved = customerRepository.save(customer);
        audit.record(saved.getId(), saved.getId(), SecurityEventType.CUSTOMER_PROFILE_UPDATED, ipAddress, "SUCCESS");
        return CustomerResponse.from(saved);
    }

    @Transactional
    public void changePassword(UUID customerId, com.lankastay.backend.dto.auth.CustomerChangePasswordRequest request, String ipAddress) {
        if (!request.newPassword().equals(request.confirmNewPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation Error", "New password and confirmation do not match.");
        }

        passwordPolicy.validate(request.newPassword());

        CustomerUser customer = requireActive(customerId);

        if (!encoder.matches(request.currentPassword(), customer.getPasswordHash())) {
            audit.record(customer.getId(), customer.getId(), SecurityEventType.CUSTOMER_PASSWORD_CHANGED, ipAddress, "FAILED");
            throw new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", "Current password is incorrect.");
        }

        if (encoder.matches(request.newPassword(), customer.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation Error", "New password must be different from current password.");
        }

        customer.setPasswordHash(encoder.encode(request.newPassword()));
        customerRepository.save(customer);

        audit.record(customer.getId(), customer.getId(), SecurityEventType.CUSTOMER_PASSWORD_CHANGED, ipAddress, "SUCCESS");
    }

    private ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "Invalid email or password");
    }
}
