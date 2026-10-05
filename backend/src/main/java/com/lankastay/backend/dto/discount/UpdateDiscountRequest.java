package com.lankastay.backend.dto.discount;

public record UpdateDiscountRequest(
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=50) String code,
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=150) String title,
        @jakarta.validation.constraints.Size(max=10000) String description,
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Pattern(regexp="PERCENTAGE|FIXED_AMOUNT|FIXED") String discountType,
        @jakarta.validation.constraints.NotNull @jakarta.validation.constraints.DecimalMin(value="0", inclusive=false) Double discountValue,
        @jakarta.validation.constraints.Min(1) Integer minimumNights,
        java.time.LocalDate validFrom, java.time.LocalDate validTo,
        @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Pattern(regexp="ACTIVE|INACTIVE") String status
) {}
