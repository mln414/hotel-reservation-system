package com.lankastay.backend.dto.review;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record HideReviewRequest(
        @NotBlank(message = "Moderation reason is required")
        @Size(max = 100, message = "Moderation reason must not exceed 100 characters")
        String moderationReason,

        @Size(max = 2000, message = "Moderation note must not exceed 2000 characters")
        String moderationNote
) {}
