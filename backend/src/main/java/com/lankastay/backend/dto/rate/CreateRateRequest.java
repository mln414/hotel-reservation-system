package com.lankastay.backend.dto.rate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateRateRequest(
        @NotNull Long hotelId,
        @NotNull Long roomId,
        @NotBlank @Size(max = 150) String ratePlanName,
        @NotBlank @Size(max = 50) String ratePlanCode,
        String rateType,
        String pricingMethod,
        @NotNull @DecimalMin(value = "0.01", message = "Base nightly rate must be greater than zero") BigDecimal baseNightlyRate,
        @DecimalMin(value = "0.01", message = "Weekend nightly rate must be greater than zero") BigDecimal weekendNightlyRate,
        LocalDate validFrom,
        LocalDate validTo,
        @Min(value = 1, message = "Minimum stay must be at least 1 night") Integer minimumStay,
        String applicableDays,
        String mealPlan,
        String cancellationPolicy,
        Boolean depositRequired,
        BigDecimal depositPercentage,
        String notes
) {}
