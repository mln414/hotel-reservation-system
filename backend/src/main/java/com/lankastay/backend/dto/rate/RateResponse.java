package com.lankastay.backend.dto.rate;

import com.lankastay.backend.entity.RoomRate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record RateResponse(
        Long id,
        Long hotelId,
        Long roomId,
        String ratePlanName,
        String ratePlanCode,
        String rateType,
        String pricingMethod,
        BigDecimal baseNightlyRate,
        BigDecimal weekendNightlyRate,
        LocalDate validFrom,
        LocalDate validTo,
        Integer minimumStay,
        String applicableDays,
        String mealPlan,
        String cancellationPolicy,
        Boolean depositRequired,
        BigDecimal depositPercentage,
        String status,
        String notes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static RateResponse from(RoomRate rate) {
        return new RateResponse(
                rate.getId(),
                rate.getHotelId(),
                rate.getRoomId(),
                rate.getRatePlanName(),
                rate.getRatePlanCode(),
                rate.getRateType(),
                rate.getPricingMethod(),
                rate.getBaseNightlyRate(),
                rate.getWeekendNightlyRate(),
                rate.getValidFrom(),
                rate.getValidTo(),
                rate.getMinimumStay(),
                rate.getApplicableDays(),
                rate.getMealPlan(),
                rate.getCancellationPolicy(),
                rate.getDepositRequired(),
                rate.getDepositPercentage(),
                rate.getStatus(),
                rate.getNotes(),
                rate.getCreatedAt(),
                rate.getUpdatedAt()
        );
    }
}
