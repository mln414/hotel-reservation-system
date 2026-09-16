package com.lankastay.backend.entity;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms")
public class Room {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hotel_id", nullable = false)
    private Long hotelId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, unique = true, length = 180)
    private String slug;

    @Column(name = "room_category", length = 50)
    private String roomCategory;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "max_occupancy")
    private Integer maxOccupancy;

    @Column(name = "max_adults")
    private Integer maxAdults;

    @Column(name = "max_children")
    private Integer maxChildren;

    @Column(name = "size_sqm")
    private Double sizeSqm;

    @Column(name = "bed_type", length = 50)
    private String bedType;

    @Column(name = "inventory_count")
    private Integer inventoryCount = 0;

    @Column(name = "base_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal basePrice = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "main_image", length = 500)
    private String mainImage;

    @Column(name = "amenities_json", columnDefinition = "TEXT")
    private String amenitiesJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Room() {
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getHotelId() { return hotelId; }
    public void setHotelId(Long hotelId) { this.hotelId = hotelId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getRoomCategory() { return roomCategory; }
    public void setRoomCategory(String roomCategory) { this.roomCategory = roomCategory; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getMaxOccupancy() { return maxOccupancy; }
    public void setMaxOccupancy(Integer maxOccupancy) { this.maxOccupancy = maxOccupancy; }

    public Integer getMaxAdults() { return maxAdults; }
    public void setMaxAdults(Integer maxAdults) { this.maxAdults = maxAdults; }

    public Integer getMaxChildren() { return maxChildren; }
    public void setMaxChildren(Integer maxChildren) { this.maxChildren = maxChildren; }

    public Double getSizeSqm() { return sizeSqm; }
    public void setSizeSqm(Double sizeSqm) { this.sizeSqm = sizeSqm; }

    public String getBedType() { return bedType; }
    public void setBedType(String bedType) { this.bedType = bedType; }

    public Integer getInventoryCount() { return inventoryCount; }
    public void setInventoryCount(Integer inventoryCount) { this.inventoryCount = inventoryCount; }

    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMainImage() { return mainImage; }
    public void setMainImage(String mainImage) { this.mainImage = mainImage; }

    public String getAmenitiesJson() { return amenitiesJson; }
    public void setAmenitiesJson(String amenitiesJson) { this.amenitiesJson = amenitiesJson; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public List<String> getAmenities() {
        if (amenitiesJson == null || amenitiesJson.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return OBJECT_MAPPER.readValue(amenitiesJson, new TypeReference<List<String>>() {
            });
        } catch (Exception ex) {
            return new ArrayList<>();
        }
    }

    public void setAmenities(List<String> amenities) {
        try {
            this.amenitiesJson = OBJECT_MAPPER.writeValueAsString(amenities == null ? List.of() : amenities);
        } catch (Exception ex) {
            this.amenitiesJson = "[]";
        }
    }
}