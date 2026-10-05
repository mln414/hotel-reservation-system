package com.lankastay.backend.dto.rate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RateStatusRequest(
        @NotBlank
        @Pattern(regexp = "ACTIVE|INACTIVE", message = "Status must be ACTIVE or INACTIVE")
        String status
) {}
