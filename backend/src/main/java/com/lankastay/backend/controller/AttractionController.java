package com.lankastay.backend.controller;

import com.lankastay.backend.dto.attraction.AttractionCreateRequest;
import com.lankastay.backend.dto.attraction.AttractionResponse;
import com.lankastay.backend.dto.attraction.AttractionUpdateRequest;
import com.lankastay.backend.service.AttractionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/management/destinations/{destinationId}/attractions")
public class AttractionController {

    private final AttractionService attractionService;

    public AttractionController(AttractionService attractionService) {
        this.attractionService = attractionService;
    }

    @GetMapping
    public ResponseEntity<List<AttractionResponse>> getAttractions(@PathVariable Long destinationId) {
        List<AttractionResponse> list = attractionService.getAttractionsByDestinationId(destinationId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{attractionId}")
    public ResponseEntity<AttractionResponse> getAttractionById(
            @PathVariable Long destinationId,
            @PathVariable Long attractionId
    ) {
        AttractionResponse attraction = attractionService.getAttractionById(destinationId, attractionId);
        return ResponseEntity.ok(attraction);
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<AttractionResponse> createAttraction(
            @PathVariable Long destinationId,
            @Valid @RequestBody AttractionCreateRequest request
    ) {
        AttractionResponse created = attractionService.createAttraction(destinationId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{attractionId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<AttractionResponse> updateAttraction(
            @PathVariable Long destinationId,
            @PathVariable Long attractionId,
            @Valid @RequestBody AttractionUpdateRequest request
    ) {
        AttractionResponse updated = attractionService.updateAttraction(destinationId, attractionId, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{attractionId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteAttraction(
            @PathVariable Long destinationId,
            @PathVariable Long attractionId
    ) {
        attractionService.deleteAttraction(destinationId, attractionId);
        return ResponseEntity.noContent().build();
    }
}
