package com.lankastay.backend.controller;

import com.lankastay.backend.entity.Discount;
import com.lankastay.backend.service.DiscountService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/management/discounts")
@PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST')")
public class DiscountController {

    private final DiscountService discountService;

    public DiscountController(DiscountService discountService) {
        this.discountService = discountService;
    }

    @GetMapping
    public List<Discount> getDiscounts(
            @RequestParam(required = false) Long hotelId
    ) {
        return discountService.getAllDiscounts(hotelId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Discount> getDiscountById(@PathVariable Long id) {
        return discountService.getDiscountById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/validate")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Discount> validateCode(
            @RequestParam String code,
            @RequestParam(required = false) Long hotelId,
            @RequestParam(required = false) Integer nights
    ) {
        return discountService.validatePromoCode(code, hotelId, nights)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public Discount createDiscount(@RequestBody Discount discount) {
        return discountService.createDiscount(discount);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public Discount updateDiscount(@PathVariable Long id, @RequestBody Discount discount) {
        return discountService.updateDiscount(id, discount);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteDiscount(@PathVariable Long id) {
        discountService.deleteDiscount(id);
        return ResponseEntity.noContent().build();
    }
}
