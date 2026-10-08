package com.lankastay.backend.service.pricing;

import com.lankastay.backend.entity.Offer;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class PercentageDiscountStrategy implements DiscountCalculationStrategy {
    @Override
    public boolean supports(String discountType) {
        return "PERCENTAGE".equalsIgnoreCase(discountType);
    }

    @Override
    public BigDecimal calculateDiscount(Offer offer, BigDecimal subtotal, long nights, int quantity) {
        return subtotal.multiply(offer.getDiscountValue())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }
}
