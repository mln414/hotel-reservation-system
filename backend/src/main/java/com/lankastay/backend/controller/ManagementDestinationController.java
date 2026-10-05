package com.lankastay.backend.controller;

import com.lankastay.backend.dto.destination.*;
import com.lankastay.backend.entity.DestinationStatus;
import com.lankastay.backend.service.DestinationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/management/destinations")
public class ManagementDestinationController {

    private final DestinationService destinationService;

    public ManagementDestinationController(DestinationService destinationService) {
        this.destinationService = destinationService;
    }

    @GetMapping
    public ResponseEntity<List<DestinationResponse>> getAllDestinationsList() {
        List<DestinationResponse> list = destinationService.getAllManagementDestinationsList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/page")
    public ResponseEntity<Page<DestinationSummaryResponse>> getPagedDestinations(
            @RequestParam(required = false) DestinationStatus status,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<DestinationSummaryResponse> pageResult = destinationService.getManagementDestinations(
                status, region, district, search, page, size
        );
        return ResponseEntity.ok(pageResult);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DestinationResponse> getDestinationById(@PathVariable Long id) {
        DestinationResponse destination = destinationService.getDestinationById(id);
        return ResponseEntity.ok(destination);
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<DestinationResponse> createDestination(@Valid @RequestBody DestinationCreateRequest request) {
        DestinationResponse created = destinationService.createDestination(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<DestinationResponse> updateDestination(
            @PathVariable Long id,
            @Valid @RequestBody DestinationUpdateRequest request
    ) {
        DestinationResponse updated = destinationService.updateDestination(id, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<DestinationResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody DestinationStatusUpdateRequest request
    ) {
        DestinationResponse updated = destinationService.setStatus(id, request.getStatus());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteDestination(@PathVariable Long id) {
        destinationService.deleteDestination(id);
        return ResponseEntity.noContent().build();
    }
}
