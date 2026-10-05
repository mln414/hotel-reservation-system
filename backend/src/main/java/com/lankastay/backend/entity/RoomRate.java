package com.lankastay.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_rates")
public class RoomRate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hotel_id", nullable = false)
    private Long hotelId;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "rate_plan_name", nullable = false, length = 150)
    private String ratePlanName;

    @Column(name = "rate_plan_code", nullable = false, length = 50)
    private String ratePlanCode;

    @Column(name = "rate_type", nullable = false, length = 50)
    private String rateType = "BASE";

    @Column(name = "pricing_method", nullable = false, length = 50)
    private String pricingMethod = "SET_PRICE";

    @Column(name = "base_nightly_rate", nullable = false, precision = 14, scale = 2)
    private BigDecimal baseNightlyRate;

    @Column(name = "weekend_nightly_rate", precision = 14, scale = 2)
    private BigDecimal weekendNightlyRate;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "minimum_stay", nullable = false)
    private Integer minimumStay = 1;

    @Column(name = "applicable_days", length = 100)
    private String applicableDays;

    @Column(name = "meal_plan", nullable = false, length = 50)
    private String mealPlan = "ROOM_ONLY";

    @Column(name = "cancellation_policy", nullable = false, length = 50)
    private String cancellationPolicy = "FLEXIBLE_24H";

    @Column(name = "deposit_required", nullable = false)
    private Boolean depositRequired = false;

    @Column(name = "deposit_percentage", precision = 5, scale = 2)
    private BigDecimal depositPercentage = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public RoomRate() {}

    public RoomRate(Long hotelId, Long roomId, String ratePlanName, String ratePlanCode, BigDecimal baseNightlyRate,
                    BigDecimal weekendNightlyRate, String mealPlan, String cancellationPolicy, Boolean depositRequired,
                    BigDecimal depositPercentage, String status) {
        this.hotelId = hotelId;
        this.roomId = roomId;
        this.ratePlanName = ratePlanName;
        this.ratePlanCode = ratePlanCode;
        this.baseNightlyRate = baseNightlyRate;
        this.weekendNightlyRate = weekendNightlyRate;
        this.mealPlan = mealPlan != null ? mealPlan : "ROOM_ONLY";
        this.cancellationPolicy = cancellationPolicy != null ? cancellationPolicy : "FLEXIBLE_24H";
        this.depositRequired = depositRequired != null ? depositRequired : false;
        this.depositPercentage = depositPercentage != null ? depositPercentage : BigDecimal.ZERO;
        this.status = status != null ? status : "ACTIVE";
    }

    public RoomRate(Long hotelId, Long roomId, String ratePlanName, String ratePlanCode, Double baseNightlyRate,
                    Double weekendNightlyRate, String mealPlan, String cancellationPolicy, Boolean depositRequired,
                    Double depositPercentage, String status) {
        this(hotelId, roomId, ratePlanName, ratePlanCode,
                baseNightlyRate != null ? BigDecimal.valueOf(baseNightlyRate) : null,
                weekendNightlyRate != null ? BigDecimal.valueOf(weekendNightlyRate) : null,
                mealPlan, cancellationPolicy, depositRequired,
                depositPercentage != null ? BigDecimal.valueOf(depositPercentage) : BigDecimal.ZERO,
                status);
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

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

    public String getRateType() { return rateType; }
    public void setRateType(String rateType) { this.rateType = rateType; }

    public String getPricingMethod() { return pricingMethod; }
    public void setPricingMethod(String pricingMethod) { this.pricingMethod = pricingMethod; }

    public BigDecimal getBaseNightlyRate() { return baseNightlyRate; }
    public void setBaseNightlyRate(BigDecimal baseNightlyRate) { this.baseNightlyRate = baseNightlyRate; }

    public BigDecimal getWeekendNightlyRate() { return weekendNightlyRate; }
    public void setWeekendNightlyRate(BigDecimal weekendNightlyRate) { this.weekendNightlyRate = weekendNightlyRate; }

    public LocalDate getValidFrom() { return validFrom; }
    public void setValidFrom(LocalDate validFrom) { this.validFrom = validFrom; }

    public LocalDate getValidTo() { return validTo; }
    public void setValidTo(LocalDate validTo) { this.validTo = validTo; }

    public Integer getMinimumStay() { return minimumStay; }
    public void setMinimumStay(Integer minimumStay) { this.minimumStay = minimumStay; }

    public String getApplicableDays() { return applicableDays; }
    public void setApplicableDays(String applicableDays) { this.applicableDays = applicableDays; }

    public String getMealPlan() { return mealPlan; }
    public void setMealPlan(String mealPlan) { this.mealPlan = mealPlan; }

    public String getCancellationPolicy() { return cancellationPolicy; }
    public void setCancellationPolicy(String cancellationPolicy) { this.cancellationPolicy = cancellationPolicy; }

    public Boolean getDepositRequired() { return depositRequired; }
    public void setDepositRequired(Boolean depositRequired) { this.depositRequired = depositRequired; }

    public BigDecimal getDepositPercentage() { return depositPercentage; }
    public void setDepositPercentage(BigDecimal depositPercentage) { this.depositPercentage = depositPercentage; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
