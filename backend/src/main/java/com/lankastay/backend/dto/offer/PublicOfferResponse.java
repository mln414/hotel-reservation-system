package com.lankastay.backend.dto.offer;

import com.lankastay.backend.entity.Offer;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

public record PublicOfferResponse(
        Long id,
        String slug,
        String title,
        String shortDescription,
        String fullDescription,
        String discountType,
        BigDecimal discountValue,
        String fixedDiscountScope,
        LocalDate stayStartDate,
        LocalDate stayEndDate,
        LocalDate bookingStartDate,
        LocalDate bookingEndDate,
        Integer minimumStay,
        Integer maximumStay,
        String applicableDays,
        String status,
        Boolean featured,
        Integer displayOrder,
        String image,
        String termsJson,
        String targetRoomCategoryKeys,
        Set<Long> targetHotelIds,
        Set<Long> targetRoomTypeIds
) {
    public static PublicOfferResponse from(Offer offer) {
        return new PublicOfferResponse(
                offer.getId(),
                offer.getSlug(),
                offer.getTitle(),
                offer.getShortDescription(),
                offer.getFullDescription(),
                offer.getDiscountType(),
                offer.getDiscountValue(),
                offer.getFixedDiscountScope(),
                offer.getStayStartDate(),
                offer.getStayEndDate(),
                offer.getBookingStartDate(),
                offer.getBookingEndDate(),
                offer.getMinimumStay(),
                offer.getMaximumStay(),
                offer.getApplicableDays(),
                offer.getStatus(),
                offer.getFeatured(),
                offer.getDisplayOrder(),
                offer.getImage(),
                offer.getTermsJson(),
                offer.getTargetRoomCategoryKeys(),
                offer.getTargetHotelIds(),
                offer.getTargetRoomTypeIds()
        );
    }
}
