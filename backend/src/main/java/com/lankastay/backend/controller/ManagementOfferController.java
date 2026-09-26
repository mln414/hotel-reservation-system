package com.lankastay.backend.controller;

import com.lankastay.backend.dto.offer.CreateOfferRequest;
import com.lankastay.backend.dto.offer.OfferResponse;
import com.lankastay.backend.dto.offer.OfferStatusRequest;
import com.lankastay.backend.dto.offer.UpdateOfferRequest;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.ManagementOfferService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/management/offers")
@PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST')")
public class ManagementOfferController {

    private final ManagementOfferService offerService;

    public ManagementOfferController(ManagementOfferService offerService) {
        this.offerService = offerService;
    }

    @GetMapping
    public List<OfferResponse> getOffers(
            @RequestParam(required = false) Long hotelId,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        return offerService.getOffers(principal, hotelId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OfferResponse> getOfferById(
            @PathVariable Long id,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        return offerService.getOfferById(principal, id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<OfferResponse> createOffer(
            @Valid @RequestBody CreateOfferRequest request,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        OfferResponse created = offerService.createOffer(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public ResponseEntity<OfferResponse> updateOffer(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOfferRequest request,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        OfferResponse updated = offerService.updateOffer(principal, id, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<OfferResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody OfferStatusRequest request,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        OfferResponse updated = offerService.updateStatus(principal, id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteOffer(
            @PathVariable Long id,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        offerService.deleteOffer(principal, id);
        return ResponseEntity.noContent().build();
    }
}
