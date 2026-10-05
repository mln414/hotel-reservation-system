package com.lankastay.backend.service;

import com.lankastay.backend.dto.staff.*;
import com.lankastay.backend.entity.*;
import com.lankastay.backend.exception.ApiException;
import com.lankastay.backend.repository.StaffUserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import com.lankastay.backend.security.Permission;

@Service
public class StaffAdministrationService {
    private final StaffUserRepository users;
    private final PasswordEncoder encoder;
    private final TemporaryPasswordGenerator passwords;
    private final SecurityAuditService audit;
    private final SessionRevocationService sessions;

    public StaffAdministrationService(StaffUserRepository users, PasswordEncoder encoder,
                                      TemporaryPasswordGenerator passwords, SecurityAuditService audit,
                                      SessionRevocationService sessions) {
        this.users = users;
        this.encoder = encoder;
        this.passwords = passwords;
        this.audit = audit;
        this.sessions = sessions;
    }

    @Transactional(readOnly = true)
    public List<StaffResponse> list() {
        return users.findAll().stream().sorted(Comparator.comparing(StaffUser::getFirstName))
                .map(StaffResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public StaffResponse get(UUID id) { return StaffResponse.from(requireUser(id)); }

    @Transactional
    public ProvisionedStaffResponse create(CreateStaffRequest request, UUID actorId, String ip) {
        validateManageableRole(request.role(), request.assignedHotelId());
        String email = StaffUser.normalizeEmail(request.email());
        if (!StaffUser.isValidEmail(email)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation Error", "Enter a valid email address.");
        }
        if (users.existsByEmail(email)) throw duplicateEmail();

        String temporaryPassword = passwords.generate();
        StaffUser user = new StaffUser();
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(email);
        user.setJobTitle(request.jobTitle() != null ? request.jobTitle().trim() : request.role().name());
        user.setDepartment(request.department() != null ? request.department().trim() : "Operations");
        user.setPhone(request.phone() != null ? request.phone().trim() : null);
        user.setRole(request.role());
        user.setAssignedHotelId(request.assignedHotelId());

        Set<com.lankastay.backend.security.Permission> requestedPerms = parsePermissions(request.permissions());
        Set<com.lankastay.backend.security.Permission> sanitizedPerms = com.lankastay.backend.security.Permission.sanitizeForRole(request.role(), requestedPerms);
        user.setPermissionsJson(serializePermissions(sanitizedPerms));

        user.setStatus(StaffStatus.ACTIVE);
        user.setMustChangePassword(true);
        user.setCreatedBy(actorId);
        // Security: the temporary password is returned only during provisioning and is never persisted in plaintext.
        user.setPasswordHash(encoder.encode(temporaryPassword));
        try {
            user = users.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            throw duplicateEmail();
        }
        audit.record(actorId, user.getId(), SecurityEventType.STAFF_CREATED, ip, "SUCCESS");
        return new ProvisionedStaffResponse(StaffResponse.from(user), temporaryPassword);
    }

    @Transactional
    public StaffResponse update(UUID id, UpdateStaffRequest request, UUID actorId, String ip) {
        StaffUser target = requireManageableTarget(id, actorId);
        validateManageableRole(request.role(), request.assignedHotelId());
        StaffRole oldRole = target.getRole();

        if (request.firstName() != null && !request.firstName().isBlank()) target.setFirstName(request.firstName().trim());
        if (request.lastName() != null && !request.lastName().isBlank()) target.setLastName(request.lastName().trim());
        if (request.jobTitle() != null && !request.jobTitle().isBlank()) target.setJobTitle(request.jobTitle().trim());
        if (request.department() != null) target.setDepartment(request.department().trim());
        if (request.phone() != null) target.setPhone(request.phone().trim());

        target.setRole(request.role());
        target.setAssignedHotelId(request.assignedHotelId());

        Set<com.lankastay.backend.security.Permission> requestedPerms = parsePermissions(request.permissions());
        Set<com.lankastay.backend.security.Permission> sanitizedPerms = com.lankastay.backend.security.Permission.sanitizeForRole(request.role(), requestedPerms);
        target.setPermissionsJson(serializePermissions(sanitizedPerms));

        users.save(target);
        if (oldRole != request.role()) {
            sessions.revokeAll(target.getEmail());
            audit.record(actorId, id, SecurityEventType.ROLE_CHANGED, ip, "SUCCESS");
        }
        return StaffResponse.from(target);
    }

    private Set<Permission> parsePermissions(List<String> list) {
        if (list == null || list.isEmpty()) return java.util.Collections.emptySet();
        Set<Permission> set = java.util.EnumSet.noneOf(Permission.class);
        for (String p : list) {
            try {
                set.add(Permission.valueOf(p.trim()));
            } catch (Exception ignored) {}
        }
        return set;
    }

    private String serializePermissions(Set<Permission> set) {
        if (set == null || set.isEmpty()) return "";
        return set.stream().map(Enum::name).collect(Collectors.joining(","));
    }

    @Transactional
    public StaffResponse updateStatus(UUID id, UpdateStaffStatusRequest request, UUID actorId, String ip) {
        StaffUser target = requireManageableTarget(id, actorId);
        target.setStatus(request.status());
        if (request.status() == StaffStatus.ACTIVE) {
            target.setFailedLoginAttempts(0);
            target.setLockedUntil(null);
        } else {
            // Security: disabling or locking an account immediately expires its active dashboard sessions.
            sessions.revokeAll(target.getEmail());
        }
        users.save(target);
        SecurityEventType event = request.status() == StaffStatus.ACTIVE ? SecurityEventType.ACCOUNT_ENABLED
                : request.status() == StaffStatus.LOCKED ? SecurityEventType.ACCOUNT_LOCKED : SecurityEventType.ACCOUNT_DISABLED;
        audit.record(actorId, id, event, ip, "SUCCESS");
        return StaffResponse.from(target);
    }

    @Transactional
    public ResetStaffPasswordResponse resetPassword(UUID id, UUID actorId, String ip) {
        StaffUser target = requireManageableTarget(id, actorId);
        String temporaryPassword = passwords.generate();
        target.setPasswordHash(encoder.encode(temporaryPassword));
        target.setMustChangePassword(true);
        target.setFailedLoginAttempts(0);
        target.setLockedUntil(null);
        users.save(target);
        sessions.revokeAll(target.getEmail());
        audit.record(actorId, id, SecurityEventType.PASSWORD_RESET_BY_ADMIN, ip, "SUCCESS");
        // Security: only the new hash is stored; this one-time response is the sole plaintext disclosure.
        return new ResetStaffPasswordResponse(id, temporaryPassword, true);
    }

    private StaffUser requireManageableTarget(UUID id, UUID actorId) {
        StaffUser target = requireUser(id);
        if (id.equals(actorId) || target.getRole() == StaffRole.MANAGER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "This staff account cannot be managed through this operation.");
        }
        return target;
    }

    private StaffUser requireUser(UUID id) {
        return users.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Staff account not found."));
    }

    private ApiException duplicateEmail() {
        return new ApiException(HttpStatus.CONFLICT, "Conflict", "An account already exists with this email.");
    }

    private void validateManageableRole(StaffRole role, Long assignedHotelId) {
        // Security: backend determines which roles may be provisioned; clients cannot self-assign manager privileges.
        if (role != StaffRole.HOTEL_STAFF && role != StaffRole.RECEPTIONIST) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation Error", "Only HOTEL_STAFF or RECEPTIONIST can be provisioned.");
        }
        if (assignedHotelId == null || assignedHotelId <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation Error", "An assigned hotel is required for this role.");
        }
    }
}
