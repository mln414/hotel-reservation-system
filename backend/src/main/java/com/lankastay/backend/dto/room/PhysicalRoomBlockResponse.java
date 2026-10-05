package com.lankastay.backend.dto.room;

import com.lankastay.backend.entity.PhysicalRoomBlock;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record PhysicalRoomBlockResponse(Long id, String type, String reason, LocalDate fromDate,
        LocalDate throughDate, String returnState, LocalDateTime createdAt) {
    public static PhysicalRoomBlockResponse from(PhysicalRoomBlock block) {
        return new PhysicalRoomBlockResponse(block.getId(), block.getType(), block.getReason(), block.getFromDate(),
                block.getThroughDate(), block.getReturnState(), block.getCreatedAt());
    }
}
