// SE2030 LankaStay - Customer Review Management and Moderation
package com.lankastay.backend.dto.review;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReviewReplyRequest(
        @NotBlank(message = "Reply text cannot be blank")
        @Size(max = 2000, message = "Reply must not exceed 2000 characters")
        String reply
) {}
