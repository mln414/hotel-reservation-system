package com.lankastay.backend.controller;

import com.lankastay.backend.entity.RoomRate;
import com.lankastay.backend.service.ManagementRateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    public List<RoomRate> getRates(
            @RequestParam(required = false) Long hotelId,
            @RequestParam(required = false) Long roomId
    ) {
        if (roomId != null) {
            return rateService.getRatesForRoom(roomId);
        }
        return rateService.getRatesForHotel(hotelId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomRate> getRateById(@PathVariable Long id) {
        return rateService.getRateById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public RoomRate createRate(@RequestBody RoomRate rate) {
        return rateService.createRate(rate);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public RoomRate updateRate(@PathVariable Long id, @RequestBody RoomRate rate) {
        return rateService.updateRate(id, rate);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteRate(@PathVariable Long id) {
        rateService.deleteRate(id);
        return ResponseEntity.noContent().build();
    }
}
