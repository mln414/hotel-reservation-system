package com.lankastay.backend.dto.room;

import com.lankastay.backend.entity.PhysicalRoom;
import java.time.LocalDateTime;
import java.util.List;

public record PhysicalRoomResponse(Long id, Long hotelId, Long roomTypeId, String roomNumber, String floor,
        String wing, String baseOperationalStatus, String operationalStatus, String status, String condition,
        String notes, List<PhysicalRoomBlockResponse> operationalBlocks, LocalDateTime createdAt, LocalDateTime updatedAt) {
    public static PhysicalRoomResponse from(PhysicalRoom room, List<PhysicalRoomBlockResponse> blocks) {
        return new PhysicalRoomResponse(room.getId(), room.getHotelId(), room.getRoomTypeId(), room.getRoomNumber(),
                room.getFloor(), room.getWing(), room.getBaseOperationalStatus(), room.getBaseOperationalStatus(),
                room.getBaseOperationalStatus(), room.getCondition(), room.getNotes(), blocks, room.getCreatedAt(), room.getUpdatedAt());
    }
}
