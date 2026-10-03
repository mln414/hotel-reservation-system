// SE2030 LankaStay - Hotel Management
// Functional Owner: Wickramasinghe M.P.T.H - IT25300115

package com.lankastay.backend.controller;

import com.lankastay.backend.dto.hotel.*;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.HotelService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/hotels")
public class ManagementHotelController {

    private final HotelService hotelService;

    public ManagementHotelController(HotelService hotelService) {
        this.hotelService = hotelService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public List<HotelResponse> listHotels(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long destinationId,
            @RequestParam(required = false) String setupStatus,
            @RequestParam(required = false) String publicationStatus,
            @RequestParam(required = false) String propertyType,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        return hotelService.filterHotels(search, destinationId, setupStatus, publicationStatus, propertyType, principal);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public HotelResponse getHotel(
            @PathVariable Long id,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        return hotelService.getHotelById(id, principal);
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<HotelResponse> createHotel(
            @Valid @RequestBody CreateHotelRequest request,
            @AuthenticationPrincipal StaffPrincipal principal,
            HttpServletRequest servletRequest
    ) {
        HotelResponse response = hotelService.createHotel(request, principal, clientIp(servletRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public HotelResponse updateHotel(
            @PathVariable Long id,
            @Valid @RequestBody UpdateHotelRequest request,
            @AuthenticationPrincipal StaffPrincipal principal,
            HttpServletRequest servletRequest
    ) {
        return hotelService.updateHotel(id, request, principal, clientIp(servletRequest));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('MANAGER')")
    public HotelResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody HotelStatusUpdateRequest request,
            @AuthenticationPrincipal StaffPrincipal principal,
            HttpServletRequest servletRequest
    ) {
        return hotelService.updateHotelStatus(id, request.status(), principal, clientIp(servletRequest));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public HotelDeleteResponse deleteHotel(
            @PathVariable Long id,
            @RequestParam String confirmationName,
            @AuthenticationPrincipal StaffPrincipal principal,
            HttpServletRequest servletRequest
    ) {
        return hotelService.deleteHotel(id, confirmationName, principal, clientIp(servletRequest));
    }

    private String clientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
}
