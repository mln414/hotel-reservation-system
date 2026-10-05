package com.lankastay.backend.controller;

import com.lankastay.backend.dto.room.CreateRoomRequest;
import com.lankastay.backend.dto.room.RoomResponse;
import com.lankastay.backend.dto.room.RoomStatusRequest;
import com.lankastay.backend.dto.room.UpdateRoomRequest;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.ManagementRoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/management/rooms")
@PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST')")
public class ManagementRoomController {

    private final ManagementRoomService roomService;

    public ManagementRoomController(ManagementRoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public ResponseEntity<List<RoomResponse>> getRooms(
            @RequestParam(required = false) Long hotelId,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        List<RoomResponse> rooms = roomService.getRooms(principal, hotelId);
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomResponse> getRoomById(
            @PathVariable Long id,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        RoomResponse room = roomService.getRoomById(principal, id);
        return ResponseEntity.ok(room);
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<RoomResponse> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        RoomResponse created = roomService.createRoom(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public ResponseEntity<RoomResponse> updateRoom(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoomRequest request,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        RoomResponse updated = roomService.updateRoom(principal, id, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<RoomResponse> updateRoomStatus(
            @PathVariable Long id,
            @Valid @RequestBody RoomStatusRequest request,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        RoomResponse updated = roomService.updateStatus(principal, id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteRoom(
            @PathVariable Long id,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        roomService.deleteRoom(principal, id);
        return ResponseEntity.noContent().build();
    }
}
