package com.lankastay.backend.dto.staff;

import com.lankastay.backend.entity.StaffRole;
import com.lankastay.backend.entity.StaffStatus;
import com.lankastay.backend.entity.StaffUser;
import com.lankastay.backend.security.Permission;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

public record StaffResponse(
        UUID id, String firstName, String lastName, String email, String jobTitle,
        String department, String phone, StaffRole role, StaffStatus status,
        Long assignedHotelId, boolean mustChangePassword, List<String> permissions,
        Instant lastLoginAt, Instant createdAt, Instant updatedAt
) {
    public static StaffResponse from(StaffUser user) {
        List<String> permsList;
        if (user.getPermissionsJson() != null && !user.getPermissionsJson().isBlank()) {
            permsList = Arrays.stream(user.getPermissionsJson().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        } else {
            permsList = Permission.getDefaultPermissionsForRole(user.getRole()).stream().map(Enum::name).toList();
        }

        return new StaffResponse(
                user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(),
                user.getJobTitle() != null ? user.getJobTitle() : (user.getRole() == StaffRole.MANAGER ? "Portfolio Manager" : user.getRole().name()),
                user.getDepartment() != null ? user.getDepartment() : "Operations",
                user.getPhone(), user.getRole(), user.getStatus(), user.getAssignedHotelId(),
                user.isMustChangePassword(), permsList, user.getLastLoginAt(),
                user.getCreatedAt(), user.getUpdatedAt()
        );
    }
}
