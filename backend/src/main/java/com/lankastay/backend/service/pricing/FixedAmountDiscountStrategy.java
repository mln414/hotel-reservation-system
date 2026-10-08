package com.lankastay.backend.service.pricing;

import com.lankastay.backend.entity.Offer;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class FixedAmountDiscountStrategy implements DiscountCalculationStrategy {
    @Override
    public boolean supports(String discountType) {
        return "FIXED_AMOUNT".equalsIgnoreCase(discountType);
    }

    @Override
    public BigDecimal calculateDiscount(Offer offer, BigDecimal subtotal, long nights, int quantity) {
        if ("PER_NIGHT".equalsIgnoreCase(offer.getFixedDiscountScope())) {
            return offer.getDiscountValue().multiply(BigDecimal.valueOf(nights * quantity));
        }
        return offer.getDiscountValue();
    }
}
