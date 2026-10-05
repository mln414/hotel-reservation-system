package com.lankastay.backend.dto.review;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ManagementReviewResponseRequest(
        @NotBlank(message = "Response text is required")
        @Size(max = 1500, message = "Response text must not exceed 1500 characters")
        String responseText,

        @Size(max = 50, message = "Response role must not exceed 50 characters")
        String responseRole
) {}
