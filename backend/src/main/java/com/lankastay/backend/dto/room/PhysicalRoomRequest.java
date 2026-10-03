package com.lankastay.backend.dto.room;

import jakarta.validation.constraints.*;

public record PhysicalRoomRequest(
        @NotNull Long roomTypeId,
        @NotBlank @Size(max = 50) String roomNumber,
        @Size(max = 50) String floor,
        @Size(max = 100) String wing,
        @Pattern(regexp = "AVAILABLE|INACTIVE|MAINTENANCE|BLOCKED") String baseOperationalStatus,
        @Pattern(regexp = "READY|CLEANING|SERVICE_REQUIRED") String condition,
        @Size(max = 1000) String notes
) {}
