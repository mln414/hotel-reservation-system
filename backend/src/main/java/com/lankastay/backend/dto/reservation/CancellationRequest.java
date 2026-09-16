package com.lankastay.backend.dto.reservation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancellationRequest(
        @NotBlank @Size(max = 300) String reason,
        @Size(max = 500) String note
) {}
