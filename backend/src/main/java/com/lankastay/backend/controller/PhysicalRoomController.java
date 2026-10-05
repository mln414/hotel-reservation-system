package com.lankastay.backend.controller;

import com.lankastay.backend.dto.room.PhysicalRoomRequest;
import com.lankastay.backend.dto.room.PhysicalRoomResponse;
import com.lankastay.backend.dto.room.PhysicalRoomBlockRequest;
import com.lankastay.backend.dto.room.PhysicalRoomBlockResponse;
import com.lankastay.backend.dto.room.PhysicalRoomBlockBatchRequest;
import com.lankastay.backend.dto.room.PhysicalRoomStatusBatchRequest;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.PhysicalRoomService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/management/physical-rooms")
@PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST')")
public class PhysicalRoomController {
    private final PhysicalRoomService service;
    public PhysicalRoomController(PhysicalRoomService service) { this.service = service; }
    @GetMapping public List<PhysicalRoomResponse> list(@RequestParam(required = false) Long hotelId, @AuthenticationPrincipal StaffPrincipal principal) {
        return service.list(principal, hotelId);
    }
    @PostMapping @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<PhysicalRoomResponse> create(@Valid @RequestBody PhysicalRoomRequest request, @AuthenticationPrincipal StaffPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(principal, request));
    }
    @PostMapping("/batch") @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<PhysicalRoomResponse>> createBatch(@Valid @RequestBody List<@Valid PhysicalRoomRequest> requests,
            @AuthenticationPrincipal StaffPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createBatch(principal, requests));
    }
    @PatchMapping("/batch/status") @PreAuthorize("hasRole('MANAGER')")
    public List<PhysicalRoomResponse> updateStatusBatch(@Valid @RequestBody PhysicalRoomStatusBatchRequest request,
            @AuthenticationPrincipal StaffPrincipal principal) {
        return service.updateStatusBatch(principal, request);
    }
    @PostMapping("/blocks/batch") @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<PhysicalRoomBlockResponse>> addBlocks(@Valid @RequestBody PhysicalRoomBlockBatchRequest request,
            @AuthenticationPrincipal StaffPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addBlocks(principal, request));
    }
    @PutMapping("/{id}") @PreAuthorize("hasRole('MANAGER')")
    public PhysicalRoomResponse update(@PathVariable Long id, @Valid @RequestBody PhysicalRoomRequest request, @AuthenticationPrincipal StaffPrincipal principal) {
        return service.update(principal, id, request);
    }
    @DeleteMapping("/{id}") @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal StaffPrincipal principal) {
        service.delete(principal, id);
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/{id}/blocks") @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<PhysicalRoomBlockResponse> addBlock(@PathVariable Long id,
            @Valid @RequestBody PhysicalRoomBlockRequest request, @AuthenticationPrincipal StaffPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addBlock(principal, id, request));
    }
    @DeleteMapping("/{id}/blocks/{blockId}") @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> removeBlock(@PathVariable Long id, @PathVariable Long blockId,
            @AuthenticationPrincipal StaffPrincipal principal) {
        service.removeBlock(principal, id, blockId);
        return ResponseEntity.noContent().build();
    }
}
