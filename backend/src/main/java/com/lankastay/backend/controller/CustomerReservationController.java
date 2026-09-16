package com.lankastay.backend.controller;

import com.lankastay.backend.dto.reservation.*;
import com.lankastay.backend.entity.CustomerUser;
import com.lankastay.backend.service.CustomerReservationService;
import com.lankastay.backend.service.CustomerSessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/reservations")
public class CustomerReservationController {
    private final CustomerSessionService sessions;
    private final CustomerReservationService reservations;

    public CustomerReservationController(CustomerSessionService sessions, CustomerReservationService reservations) {
        this.sessions = sessions;
        this.reservations = reservations;
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> create(@Valid @RequestBody CreateReservationRequest request,
            HttpServletRequest servletRequest) {
        CustomerUser customer = sessions.requireCustomer(servletRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(reservations.create(customer.getId(), request));
    }

    @PostMapping("/quote")
    public ReservationQuoteResponse quote(@Valid @RequestBody ReservationQuoteRequest body,
            HttpServletRequest request) {
        sessions.requireCustomer(request);
        return reservations.quote(body);
    }

    @GetMapping
    public List<ReservationResponse> list(HttpServletRequest request) {
        return reservations.list(sessions.requireCustomer(request).getId());
    }

    @GetMapping("/{id}")
    public ReservationResponse get(@PathVariable Long id, HttpServletRequest request) {
        return reservations.get(sessions.requireCustomer(request).getId(), id);
    }

    @PostMapping("/{id}/cancel")
    public ReservationResponse cancel(@PathVariable Long id, @Valid @RequestBody CancellationRequest body,
            HttpServletRequest request) {
        return reservations.cancel(sessions.requireCustomer(request).getId(), id, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        reservations.delete(sessions.requireCustomer(request).getId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/availability")
    public AvailabilityResponse availability(@RequestParam Long hotelId, @RequestParam Long roomId,
            @RequestParam LocalDate checkIn, @RequestParam LocalDate checkOut,
            @RequestParam(defaultValue = "1") int quantity) {
        // This is a public, read-only discovery check. Quote and create still
        // require a customer session and recheck availability transactionally.
        return reservations.availability(hotelId, roomId, checkIn, checkOut, quantity);
    }
}
