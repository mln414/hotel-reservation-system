package com.lankastay.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import static com.lankastay.backend.service.PasswordPolicy.MAX_LENGTH;
import static com.lankastay.backend.service.PasswordPolicy.MIN_LENGTH;

public record CustomerChangePasswordRequest(
        @NotBlank(message = "Current password is required.")
        @Size(max = MAX_LENGTH, message = "Current password must be 128 characters or fewer.")
        String currentPassword,

        @NotBlank(message = "New password is required.")
        @Size(min = MIN_LENGTH, max = MAX_LENGTH, message = "New password must be between 8 and 128 characters.")
        String newPassword,

        @NotBlank(message = "Confirm password is required.")
        @Size(max = MAX_LENGTH, message = "Confirm password must be 128 characters or fewer.")
        String confirmNewPassword
) {
    @Override public String toString() { return "CustomerChangePasswordRequest[passwords=<redacted>]"; }
}
