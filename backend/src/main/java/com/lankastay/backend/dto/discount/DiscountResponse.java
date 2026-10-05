package com.lankastay.backend.dto.discount;

import com.lankastay.backend.entity.Discount;
import java.time.LocalDate;

public record DiscountResponse(Long id, Long hotelId, String code, String title, String description,
        String discountType, Double discountValue, Integer minimumNights, LocalDate validFrom, LocalDate validTo, String status) {
    public static DiscountResponse from(Discount d) {
        return new DiscountResponse(d.getId(), d.getHotelId(), d.getCode(), d.getTitle(), d.getDescription(),
                d.getDiscountType(), d.getDiscountValue(), d.getMinimumNights(), d.getValidFrom(), d.getValidTo(), d.getStatus());
    }
}
