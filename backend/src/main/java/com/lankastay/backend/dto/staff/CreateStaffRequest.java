package com.lankastay.backend.dto.staff;

import com.lankastay.backend.entity.StaffRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateStaffRequest(
        @NotBlank @Size(max = 80) String firstName,
        @NotBlank @Size(max = 80) String lastName,
        @NotBlank @Size(max = 512) String email,
        @NotBlank @Size(max = 100) String jobTitle,
        @Size(max = 100) String department,
        @Size(max = 30) String phone,
        @NotNull StaffRole role,
        Long assignedHotelId,
        List<String> permissions
) {}
