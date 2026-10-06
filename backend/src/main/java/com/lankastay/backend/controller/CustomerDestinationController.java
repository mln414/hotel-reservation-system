package com.lankastay.backend.controller;

import com.lankastay.backend.dto.destination.DestinationResponse;
import com.lankastay.backend.dto.destination.DestinationSummaryResponse;
import com.lankastay.backend.service.DestinationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/destinations")
public class CustomerDestinationController {

    private final DestinationService destinationService;

    public CustomerDestinationController(DestinationService destinationService) {
        this.destinationService = destinationService;
    }

    /**
     * Public Read-Only Endpoint: Fetch all active customer destinations
     * GET /api/destinations
     */
    @GetMapping
    public ResponseEntity<List<DestinationSummaryResponse>> getPublicActiveDestinations() {
        List<DestinationSummaryResponse> list = destinationService.getActiveCustomerDestinations();
        return ResponseEntity.ok(list);
    }

    /**
     * Public Read-Only Endpoint: Fetch single active customer destination by ID or slug
     * GET /api/destinations/{identifier}
     */
    @GetMapping("/{identifier}")
    public ResponseEntity<DestinationResponse> getDestinationByIdOrSlug(@PathVariable String identifier) {
        DestinationResponse destination = destinationService.getActiveCustomerDestinationBySlugOrId(identifier);
        return ResponseEntity.ok(destination);
    }
}
