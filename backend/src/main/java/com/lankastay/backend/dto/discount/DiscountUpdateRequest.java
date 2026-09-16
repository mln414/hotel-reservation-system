package com.lankastay.backend.dto.discount;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class DiscountUpdateRequest {

    private Long hotelId;

    @Size(max = 50, message = "Promo code must not exceed 50 characters")
    private String code;

    @Size(max = 150, message = "Title must not exceed 150 characters")
    private String title;

    private String description;

    @Size(max = 30, message = "Discount type must not exceed 30 characters")
    private String discountType;

    @Positive(message = "Discount value must be greater than 0")
    private Double discountValue;

    @DecimalMin(value = "1", message = "Minimum nights must be at least 1")
    private Integer minimumNights;

    private LocalDate validFrom;
    private LocalDate validTo;
    private String status;

    public DiscountUpdateRequest() {}

    public Long getHotelId() { return hotelId; }
    public void setHotelId(Long hotelId) { this.hotelId = hotelId; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDiscountType() { return discountType; }
    public void setDiscountType(String discountType) { this.discountType = discountType; }

    public Double getDiscountValue() { return discountValue; }
    public void setDiscountValue(Double discountValue) { this.discountValue = discountValue; }

    public Integer getMinimumNights() { return minimumNights; }
    public void setMinimumNights(Integer minimumNights) { this.minimumNights = minimumNights; }

    public LocalDate getValidFrom() { return validFrom; }
    public void setValidFrom(LocalDate validFrom) { this.validFrom = validFrom; }

    public LocalDate getValidTo() { return validTo; }
    public void setValidTo(LocalDate validTo) { this.validTo = validTo; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
