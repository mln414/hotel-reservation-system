package com.lankastay.backend.controller;

import com.lankastay.backend.entity.Room;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/management/rooms")
@PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST')")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public List<Room> getRooms(
            @RequestParam(required = false) Long hotelId,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        Long targetHotelId = "MANAGER".equalsIgnoreCase(principal.role()) ? hotelId : principal.assignedHotelId();
        return roomService.getRoomsForHotel(targetHotelId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Room> getRoomById(@PathVariable Long id) {
        return roomService.getRoomById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public Room createRoom(@RequestBody Room room, @AuthenticationPrincipal StaffPrincipal principal) {
        if (!"MANAGER".equalsIgnoreCase(principal.role()) && principal.assignedHotelId() != null) {
            room.setHotelId(principal.assignedHotelId());
        }
        return roomService.createRoom(room);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public Room updateRoom(@PathVariable Long id, @RequestBody Room room) {
        return roomService.updateRoom(id, room);
    }

    @PutMapping("/{id}/amenities")
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public Room updateRoomAmenities(@PathVariable Long id, @RequestBody Map<String, List<String>> body) {
        List<String> amenities = body.getOrDefault("amenities", List.of());
        return roomService.updateRoomAmenities(id, amenities);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        roomService.deleteRoom(id);
        return ResponseEntity.noContent().build();
    }
}
