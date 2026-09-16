package com.lankastay.backend.controller;

import com.lankastay.backend.entity.Discount;
import com.lankastay.backend.service.DiscountService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/discounts")
public class PublicDiscountController {
    private final DiscountService discounts;

    public PublicDiscountController(DiscountService discounts) {
        this.discounts = discounts;
    }

    @GetMapping
    public List<Discount> list() {
        return discounts.getAllDiscounts(null).stream()
                .filter(discount -> "ACTIVE".equalsIgnoreCase(discount.getStatus()))
                .toList();
    }
}
