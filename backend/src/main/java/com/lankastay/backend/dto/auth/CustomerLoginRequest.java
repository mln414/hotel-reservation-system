package com.lankastay.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import static com.lankastay.backend.service.PasswordPolicy.MAX_LENGTH;

public record CustomerLoginRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Password is required")
        @Size(max = MAX_LENGTH, message = "Password must be 128 characters or fewer")
        String password
) {
    @Override public String toString() { return "CustomerLoginRequest[email=" + email + ", password=<redacted>]"; }
}
