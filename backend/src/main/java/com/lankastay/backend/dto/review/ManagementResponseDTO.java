package com.lankastay.backend.dto.review;

import java.time.Instant;

public record ManagementResponseDTO(
        String responseText,
        String respondedRole,
        Instant respondedAt,
        Instant updatedAt
) {}
