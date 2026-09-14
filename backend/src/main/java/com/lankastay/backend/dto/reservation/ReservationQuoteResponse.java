package com.lankastay.backend.dto.reservation;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ReservationQuoteResponse(
        boolean available,
        int availableQuantity,
        int nights,
        List<NightlyPrice> nightlyPrices,
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal finalTotal,
        AppliedOfferDto appliedOffer,
        String message
) {
    public record NightlyPrice(LocalDate date, BigDecimal amount) {}

    public record AppliedOfferDto(
            Long id,
            String title,
            String discountType,
            BigDecimal discountValue,
            String fixedDiscountScope,
            BigDecimal discountAmount
    ) {}

    public ReservationQuoteResponse(
            boolean available,
            int availableQuantity,
            int nights,
            List<NightlyPrice> nightlyPrices,
            BigDecimal subtotal,
            BigDecimal discount,
            BigDecimal finalTotal,
            String message
    ) {
        this(available, availableQuantity, nights, nightlyPrices, subtotal, discount, finalTotal, null, message);
    }
}
