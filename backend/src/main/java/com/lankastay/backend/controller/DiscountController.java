package com.lankastay.backend.controller;

import com.lankastay.backend.dto.discount.*;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.DiscountService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/management/discounts")
@PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST')")
public class DiscountController {
    private final DiscountService service;
    public DiscountController(DiscountService service) { this.service = service; }

    @GetMapping
    public List<DiscountResponse> list(@RequestParam(required=false) Long hotelId, @AuthenticationPrincipal StaffPrincipal principal) {
        return service.listScoped(hotelId, principal).stream().map(DiscountResponse::from).toList();
    }
    @GetMapping("/{id}")
    public DiscountResponse get(@PathVariable Long id, @AuthenticationPrincipal StaffPrincipal principal) {
        return DiscountResponse.from(service.getScoped(id, principal));
    }
    @GetMapping("/validate")
    @PreAuthorize("permitAll()")
    public ResponseEntity<DiscountResponse> validate(@RequestParam String code, @RequestParam(required=false) Long hotelId,
            @RequestParam(required=false) Integer nights) {
        return service.validatePromoCode(code, hotelId, nights).map(DiscountResponse::from).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public DiscountResponse create(@Valid @RequestBody CreateDiscountRequest body, @AuthenticationPrincipal StaffPrincipal principal) {
        return DiscountResponse.from(service.createDiscount(body, principal));
    }
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public DiscountResponse update(@PathVariable Long id, @Valid @RequestBody UpdateDiscountRequest body,
            @AuthenticationPrincipal StaffPrincipal principal) {
        return DiscountResponse.from(service.updateDiscount(id, body, principal));
    }
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal StaffPrincipal principal) {
        service.deleteDiscount(id, principal);
        return ResponseEntity.noContent().build();
    }
}
