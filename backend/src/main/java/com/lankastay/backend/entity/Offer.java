package com.lankastay.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "offers")
public class Offer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "short_description", nullable = false, length = 500)
    private String shortDescription;

    @Column(name = "full_description", nullable = false, columnDefinition = "TEXT")
    private String fullDescription;

    @Column(name = "discount_type", nullable = false, length = 30)
    private String discountType; // PERCENTAGE, FIXED_AMOUNT

    @Column(name = "discount_value", nullable = false, precision = 14, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "fixed_discount_scope", length = 30)
    private String fixedDiscountScope = "PER_STAY"; // PER_STAY, PER_NIGHT

    @Column(name = "stay_start_date", nullable = false)
    private LocalDate stayStartDate;

    @Column(name = "stay_end_date", nullable = false)
    private LocalDate stayEndDate;

    @Column(name = "booking_start_date")
    private LocalDate bookingStartDate;

    @Column(name = "booking_end_date")
    private LocalDate bookingEndDate;

    @Column(name = "minimum_stay", nullable = false)
    private Integer minimumStay = 1;

    @Column(name = "maximum_stay")
    private Integer maximumStay;

    @Column(name = "applicable_days", nullable = false, length = 100)
    private String applicableDays = "MON,TUE,WED,THU,FRI,SAT,SUN";

    @Column(nullable = false, length = 20)
    private String status = "DRAFT"; // DRAFT, ACTIVE, INACTIVE

    @Column(nullable = false)
    private Boolean featured = false;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @Column(length = 500)
    private String image;

    @Column(name = "terms_json", columnDefinition = "TEXT")
    private String termsJson;

    @Column(name = "target_room_category_keys", length = 255)
    private String targetRoomCategoryKeys;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "offer_hotels", joinColumns = @JoinColumn(name = "offer_id"))
    @Column(name = "hotel_id")
    private Set<Long> targetHotelIds = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "offer_rooms", joinColumns = @JoinColumn(name = "offer_id"))
    @Column(name = "room_id")
    private Set<Long> targetRoomTypeIds = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Offer() {}

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

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getShortDescription() { return shortDescription; }
    public void setShortDescription(String shortDescription) { this.shortDescription = shortDescription; }

    public String getFullDescription() { return fullDescription; }
    public void setFullDescription(String fullDescription) { this.fullDescription = fullDescription; }

    public String getDiscountType() { return discountType; }
    public void setDiscountType(String discountType) { this.discountType = discountType; }

    public BigDecimal getDiscountValue() { return discountValue; }
    public void setDiscountValue(BigDecimal discountValue) { this.discountValue = discountValue; }

    public String getFixedDiscountScope() { return fixedDiscountScope; }
    public void setFixedDiscountScope(String fixedDiscountScope) { this.fixedDiscountScope = fixedDiscountScope; }

    public LocalDate getStayStartDate() { return stayStartDate; }
    public void setStayStartDate(LocalDate stayStartDate) { this.stayStartDate = stayStartDate; }

    public LocalDate getStayEndDate() { return stayEndDate; }
    public void setStayEndDate(LocalDate stayEndDate) { this.stayEndDate = stayEndDate; }

    public LocalDate getBookingStartDate() { return bookingStartDate; }
    public void setBookingStartDate(LocalDate bookingStartDate) { this.bookingStartDate = bookingStartDate; }

    public LocalDate getBookingEndDate() { return bookingEndDate; }
    public void setBookingEndDate(LocalDate bookingEndDate) { this.bookingEndDate = bookingEndDate; }

    public Integer getMinimumStay() { return minimumStay; }
    public void setMinimumStay(Integer minimumStay) { this.minimumStay = minimumStay; }

    public Integer getMaximumStay() { return maximumStay; }
    public void setMaximumStay(Integer maximumStay) { this.maximumStay = maximumStay; }

    public String getApplicableDays() { return applicableDays; }
    public void setApplicableDays(String applicableDays) { this.applicableDays = applicableDays; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getFeatured() { return featured; }
    public void setFeatured(Boolean featured) { this.featured = featured; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public String getTermsJson() { return termsJson; }
    public void setTermsJson(String termsJson) { this.termsJson = termsJson; }

    public String getTargetRoomCategoryKeys() { return targetRoomCategoryKeys; }
    public void setTargetRoomCategoryKeys(String targetRoomCategoryKeys) { this.targetRoomCategoryKeys = targetRoomCategoryKeys; }

    public Set<Long> getTargetHotelIds() { return targetHotelIds; }
    public void setTargetHotelIds(Set<Long> targetHotelIds) { this.targetHotelIds = targetHotelIds; }

    public Set<Long> getTargetRoomTypeIds() { return targetRoomTypeIds; }
    public void setTargetRoomTypeIds(Set<Long> targetRoomTypeIds) { this.targetRoomTypeIds = targetRoomTypeIds; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
