package com.lankastay.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateCustomerProfileRequest(
        @NotBlank(message = "First name is required.")
        @Size(max = 80, message = "First name must be at most 80 characters.")
        String firstName,

        @NotBlank(message = "Last name is required.")
        @Size(max = 80, message = "Last name must be at most 80 characters.")
        String lastName,

        @Size(max = 30, message = "Phone must be at most 30 characters.")
        String phone,

        @Email(message = "Enter a valid email address.")
        String email
) {
}
