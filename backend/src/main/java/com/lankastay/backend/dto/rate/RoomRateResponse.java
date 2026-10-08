package com.lankastay.backend.dto.rate;

import java.time.LocalDateTime;

public class RoomRateResponse {

    private Long id;
    private Long hotelId;
    private Long roomId;
    private String ratePlanName;
    private String ratePlanCode;
    private Double baseNightlyRate;
    private Double pricingValue;
    private String pricingMethod;
    private String changeType;
    private String rateType;
    private Double weekendNightlyRate;
    private String mealPlan;
    private String cancellationPolicy;
    private Boolean depositRequired;
    private Double depositPercentage;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public RoomRateResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getHotelId() { return hotelId; }
    public void setHotelId(Long hotelId) { this.hotelId = hotelId; }

    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }

    public String getRatePlanName() { return ratePlanName; }
    public void setRatePlanName(String ratePlanName) { this.ratePlanName = ratePlanName; }

    public String getRatePlanCode() { return ratePlanCode; }
    public void setRatePlanCode(String ratePlanCode) { this.ratePlanCode = ratePlanCode; }

    public Double getBaseNightlyRate() { return baseNightlyRate; }
    public void setBaseNightlyRate(Double baseNightlyRate) { this.baseNightlyRate = baseNightlyRate; }

    public Double getPricingValue() { return pricingValue; }
    public void setPricingValue(Double pricingValue) { this.pricingValue = pricingValue; }

    public String getPricingMethod() { return pricingMethod; }
    public void setPricingMethod(String pricingMethod) { this.pricingMethod = pricingMethod; }

    public String getChangeType() { return changeType; }
    public void setChangeType(String changeType) { this.changeType = changeType; }

    public String getRateType() { return rateType; }
    public void setRateType(String rateType) { this.rateType = rateType; }

    public Double getWeekendNightlyRate() { return weekendNightlyRate; }
    public void setWeekendNightlyRate(Double weekendNightlyRate) { this.weekendNightlyRate = weekendNightlyRate; }

    public String getMealPlan() { return mealPlan; }
    public void setMealPlan(String mealPlan) { this.mealPlan = mealPlan; }

    public String getCancellationPolicy() { return cancellationPolicy; }
    public void setCancellationPolicy(String cancellationPolicy) { this.cancellationPolicy = cancellationPolicy; }

    public Boolean getDepositRequired() { return depositRequired; }
    public void setDepositRequired(Boolean depositRequired) { this.depositRequired = depositRequired; }

    public Double getDepositPercentage() { return depositPercentage; }
    public void setDepositPercentage(Double depositPercentage) { this.depositPercentage = depositPercentage; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
