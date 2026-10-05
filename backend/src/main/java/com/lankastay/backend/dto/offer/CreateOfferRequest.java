package com.lankastay.backend.dto.offer;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public record CreateOfferRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 500) String shortDescription,
        @NotBlank String fullDescription,
        @NotBlank String discountType, // PERCENTAGE, FIXED_AMOUNT
        @NotNull @DecimalMin(value = "0.01", message = "Discount value must be greater than zero") BigDecimal discountValue,
        String fixedDiscountScope, // PER_STAY, PER_NIGHT
        @NotNull LocalDate stayStartDate,
        @NotNull LocalDate stayEndDate,
        LocalDate bookingStartDate,
        LocalDate bookingEndDate,
        @Min(value = 1, message = "Minimum stay must be at least 1 night") Integer minimumStay,
        Integer maximumStay,
        String applicableDays,
        String status, // DRAFT, ACTIVE, INACTIVE
        Boolean featured,
        Integer displayOrder,
        String image,
        List<String> terms,
        String termsJson,
        String targetRoomCategoryKeys,
        Set<Long> targetHotelIds,
        Set<Long> targetRoomTypeIds
) {}
