package com.lankastay.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import static com.lankastay.backend.service.PasswordPolicy.MAX_LENGTH;
import static com.lankastay.backend.service.PasswordPolicy.MIN_LENGTH;

public record CustomerRegisterRequest(
        @NotBlank(message = "First name is required")
        @Size(max = 50, message = "First name must be 50 characters or fewer")
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 50, message = "Last name must be 50 characters or fewer")
        String lastName,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        @Size(max = 254, message = "Email must be 254 characters or fewer")
        String email,

        @Size(max = 30, message = "Phone number must be 30 characters or fewer")
        String phone,

        @NotBlank(message = "Password is required")
        @Size(min = MIN_LENGTH, max = MAX_LENGTH, message = "Password must be between 8 and 128 characters")
        String password
) {
    @Override public String toString() {
        return "CustomerRegisterRequest[firstName=" + firstName + ", lastName=" + lastName
                + ", email=" + email + ", phone=" + phone + ", password=<redacted>]";
    }
}
