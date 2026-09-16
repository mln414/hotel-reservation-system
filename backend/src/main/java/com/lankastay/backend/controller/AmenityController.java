package com.lankastay.backend.controller;

import com.lankastay.backend.entity.Amenity;
import com.lankastay.backend.service.AmenityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/management/amenities")
@PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST')")
public class AmenityController {

    private final AmenityService amenityService;

    public AmenityController(AmenityService amenityService) {
        this.amenityService = amenityService;
    }

    @GetMapping
    public List<Amenity> getAmenities(@RequestParam(required = false) String status) {
        return amenityService.getAllAmenities(status);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Amenity> getAmenityById(@PathVariable Long id) {
        return amenityService.getAmenityById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public Amenity createAmenity(@RequestBody Amenity amenity) {
        return amenityService.createAmenity(amenity);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public Amenity updateAmenity(@PathVariable Long id, @RequestBody Amenity amenity) {
        return amenityService.updateAmenity(id, amenity);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteAmenity(@PathVariable Long id) {
        amenityService.deleteAmenity(id);
        return ResponseEntity.noContent().build();
    }
}
