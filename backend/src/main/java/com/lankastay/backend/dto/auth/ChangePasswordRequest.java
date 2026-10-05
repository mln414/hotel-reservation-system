package com.lankastay.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank @Size(max = 128) String currentPassword,
        @NotBlank @Size(min = 8, max = 128) String newPassword,
        @NotBlank @Size(max = 128) String confirmNewPassword
) {
    @Override public String toString() { return "ChangePasswordRequest[passwords=<redacted>]"; }
}
