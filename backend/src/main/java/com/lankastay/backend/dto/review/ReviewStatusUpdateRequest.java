// SE2030 LankaStay - Customer Review Management and Moderation
package com.lankastay.backend.dto.review;

import com.lankastay.backend.entity.ReviewStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewStatusUpdateRequest(
        @NotNull(message = "Status is required")
        ReviewStatus status,

        @Size(max = 500, message = "Moderation note must not exceed 500 characters")
        String moderationNote
) {}
