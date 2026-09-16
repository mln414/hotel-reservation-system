package com.lankastay.backend.controller;

import com.lankastay.backend.dto.reservation.*;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.ManagementReservationService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.List;

@RestController
@RequestMapping("/api/v1/management/reservations")
@PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST')")
public class ManagementReservationController {
    private final ManagementReservationService service;
    public ManagementReservationController(ManagementReservationService service) { this.service = service; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse create(@Valid @RequestBody CreateReservationRequest request,
                                      @AuthenticationPrincipal StaffPrincipal principal) {
        return service.create(principal, request);
    }

    @PostMapping("/quote")
    public ReservationQuoteResponse quote(@Valid @RequestBody ReservationQuoteRequest request,
                                          @AuthenticationPrincipal StaffPrincipal principal) {
        return service.quote(principal, request);
    }

    @GetMapping
    public List<ReservationResponse> list(@RequestParam(required = false) Long hotelId, @AuthenticationPrincipal StaffPrincipal principal) {
        return service.list(principal, hotelId);
    }
    @GetMapping("/{id}")
    public ReservationResponse get(@PathVariable Long id, @AuthenticationPrincipal StaffPrincipal principal) { return service.get(principal, id); }
    @GetMapping("/{id}/items")
    public List<ReservationItemResponse> items(@PathVariable Long id, @AuthenticationPrincipal StaffPrincipal principal) { return service.getItems(principal, id); }
    @PatchMapping("/{id}/status")
    public ReservationResponse status(@PathVariable Long id, @RequestBody ReservationStatusRequest request,
                                      @AuthenticationPrincipal StaffPrincipal principal) { return service.updateStatus(principal, id, request); }
    @PostMapping("/{id}/cancel")
    public ReservationResponse cancel(@PathVariable Long id, @Valid @RequestBody CancellationRequest request,
                                      @AuthenticationPrincipal StaffPrincipal principal) { return service.cancel(principal, id, request); }
    @PatchMapping("/{id}/assign-room")
    public ReservationResponse assign(@PathVariable Long id, @Valid @RequestBody RoomAssignmentRequest request,
                                      @AuthenticationPrincipal StaffPrincipal principal) { return service.assignRoom(principal, id, request); }
}
