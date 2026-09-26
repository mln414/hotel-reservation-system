package com.lankastay.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rooms")
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hotel_id", nullable = false)
    private Long hotelId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 150)
    private String slug;

    @Column(name = "room_category", nullable = false, length = 50)
    private String roomCategory;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "max_occupancy", nullable = false)
    private Integer maxOccupancy = 2;

    @Column(name = "max_adults", nullable = false)
    private Integer maxAdults = 2;

    @Column(name = "max_children", nullable = false)
    private Integer maxChildren = 1;

    @Column(name = "size_sqm")
    private Double sizeSqm;

    @Column(name = "bed_type", length = 50)
    private String bedType;

    @Column(name = "inventory_count", nullable = false)
    private Integer inventoryCount = 1;

    @Column(name = "base_price", nullable = false)
    private Double basePrice = 0.0;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "main_image", length = 255)
    private String mainImage;

    @Column(name = "amenities_json", columnDefinition = "TEXT")
    private String amenitiesJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Room() {}

    public Room(Long hotelId, String name, String slug, String roomCategory, String description, Integer maxOccupancy, Integer maxAdults, Integer maxChildren, Double sizeSqm, String bedType, Integer inventoryCount, Double basePrice, String status, String mainImage, String amenitiesJson) {
        this.hotelId = hotelId;
        this.name = name;
        this.slug = slug;
        this.roomCategory = roomCategory;
        this.description = description;
        this.maxOccupancy = maxOccupancy;
        this.maxAdults = maxAdults;
        this.maxChildren = maxChildren;
        this.sizeSqm = sizeSqm;
        this.bedType = bedType;
        this.inventoryCount = inventoryCount;
        this.basePrice = basePrice;
        this.status = status;
        this.mainImage = mainImage;
        this.amenitiesJson = amenitiesJson;
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

    public Double getBasePrice() { return basePrice; }
    public void setBasePrice(Double basePrice) { this.basePrice = basePrice; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMainImage() { return mainImage; }
    public void setMainImage(String mainImage) { this.mainImage = mainImage; }

    public String getAmenitiesJson() { return amenitiesJson; }
    public void setAmenitiesJson(String amenitiesJson) { this.amenitiesJson = amenitiesJson; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
