package com.lankastay.backend.controller;

import com.lankastay.backend.dto.rate.CreateRateRequest;
import com.lankastay.backend.dto.rate.RateResponse;
import com.lankastay.backend.dto.rate.RateStatusRequest;
import com.lankastay.backend.dto.rate.UpdateRateRequest;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.ManagementRateService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/management/rates")
@PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST')")
public class ManagementRateController {
    private final ManagementRateService rateService;

    public ManagementRateController(ManagementRateService rateService) {
        this.rateService = rateService;
    }

    @GetMapping
    public List<RateResponse> getRates(
            @RequestParam(required = false) Long hotelId,
            @RequestParam(required = false) Long roomId,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        if (roomId != null) {
            return rateService.getRatesForRoom(principal, roomId);
        }
        return rateService.getRatesForHotel(principal, hotelId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RateResponse> getRateById(
            @PathVariable Long id,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        return rateService.getRateById(principal, id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<RateResponse> createRate(
            @Valid @RequestBody CreateRateRequest request,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        RateResponse created = rateService.createRate(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public ResponseEntity<RateResponse> updateRate(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRateRequest request,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        RateResponse updated = rateService.updateRate(principal, id, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<RateResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody RateStatusRequest request,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        RateResponse updated = rateService.updateStatus(principal, id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteRate(
            @PathVariable Long id,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        rateService.deleteRate(principal, id);
        return ResponseEntity.noContent().build();
    }
}
