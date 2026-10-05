package com.lankastay.backend.dto.auth;

import com.lankastay.backend.entity.StaffRole;
import com.lankastay.backend.entity.StaffStatus;
import com.lankastay.backend.entity.StaffUser;
import com.lankastay.backend.security.Permission;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

public record CurrentUserResponse(
        UUID id, String email, String firstName, String lastName, String jobTitle,
        String department, String phone, StaffRole role, StaffStatus status,
        Long assignedHotelId, boolean mustChangePassword, List<String> permissions
) {
    public static CurrentUserResponse from(StaffUser user) {
        List<String> permsList;
        if (user.getPermissionsJson() != null && !user.getPermissionsJson().isBlank()) {
            permsList = Arrays.stream(user.getPermissionsJson().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        } else {
            permsList = Permission.getDefaultPermissionsForRole(user.getRole()).stream().map(Enum::name).toList();
        }

        return new CurrentUserResponse(
                user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(),
                user.getJobTitle() != null ? user.getJobTitle() : (user.getRole() == StaffRole.MANAGER ? "Portfolio Manager" : user.getRole().name()),
                user.getDepartment() != null ? user.getDepartment() : "Operations",
                user.getPhone(), user.getRole(), user.getStatus(), user.getAssignedHotelId(),
                user.isMustChangePassword(), permsList
        );
    }
}
