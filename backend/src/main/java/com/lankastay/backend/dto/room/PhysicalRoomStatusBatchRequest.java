package com.lankastay.backend.dto.room;

import jakarta.validation.constraints.*;
import java.util.List;

public record PhysicalRoomStatusBatchRequest(
        @NotEmpty @Size(max = 100) List<@NotNull Long> roomIds,
        @NotBlank @Pattern(regexp = "AVAILABLE|INACTIVE|MAINTENANCE|BLOCKED") String status
) {}
