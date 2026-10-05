package com.lankastay.backend.dto.room;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public record PhysicalRoomBlockBatchRequest(
        @NotEmpty @Size(max = 100) List<@NotNull Long> roomIds,
        @NotNull @Valid PhysicalRoomBlockRequest block
) {}
