package com.lankastay.backend.dto.offer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OfferStatusRequest(
        @NotBlank
        @Pattern(regexp = "DRAFT|ACTIVE|INACTIVE", message = "Status must be DRAFT, ACTIVE, or INACTIVE")
        String status
) {}
