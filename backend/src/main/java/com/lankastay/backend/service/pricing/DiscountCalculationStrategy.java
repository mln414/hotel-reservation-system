package com.lankastay.backend.service.pricing;

import com.lankastay.backend.entity.Offer;
import java.math.BigDecimal;

/** A discount calculation algorithm selected by the offer's discount type. */
public interface DiscountCalculationStrategy {
    boolean supports(String discountType);

    BigDecimal calculateDiscount(Offer offer, BigDecimal subtotal, long nights, int quantity);
}
