package com.lankastay.backend.controller;

import com.lankastay.backend.dto.discount.DiscountResponse;
import com.lankastay.backend.service.DiscountService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/discounts")
public class PublicDiscountController {
    private final DiscountService service;
    public PublicDiscountController(DiscountService service) { this.service = service; }
    @GetMapping("/validate")
    public ResponseEntity<DiscountResponse> validate(@RequestParam String code, @RequestParam(required=false) Long hotelId,
            @RequestParam(required=false) Integer nights) {
        return service.validatePromoCode(code, hotelId, nights).map(DiscountResponse::from).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
