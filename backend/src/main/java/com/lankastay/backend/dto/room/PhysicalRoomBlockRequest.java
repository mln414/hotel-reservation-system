package com.lankastay.backend.dto.room;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record PhysicalRoomBlockRequest(
        @NotBlank @Pattern(regexp = "MAINTENANCE|BLOCKED") String type,
        @NotBlank @Size(max = 500) String reason,
        @NotNull LocalDate fromDate,
        @NotNull LocalDate throughDate,
        @Pattern(regexp = "AVAILABLE") String returnState
) {}
