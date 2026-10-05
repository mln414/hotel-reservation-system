package com.lankastay.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StaffLoginRequest(
        @NotBlank @Size(max = 512) String email,
        @NotBlank @Size(max = 128) String password
) {
    @Override public String toString() { return "StaffLoginRequest[email=" + email + ", password=<redacted>]"; }
}
