package com.lankastay.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "destinations", indexes = {
    @Index(name = "idx_destinations_slug", columnList = "slug", unique = true),
    @Index(name = "idx_destinations_status", columnList = "status"),
    @Index(name = "idx_destinations_region_district", columnList = "region, district")
})
public class Destination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(name = "short_description", nullable = false, length = 255)
    private String shortDescription;

    @Column(name = "full_description", columnDefinition = "TEXT")
    private String fullDescription;

    @Column(length = 100)
    private String category;

    @Column(length = 100)
    private String region;

    @Column(length = 100)
    private String district;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DestinationStatus status = DestinationStatus.DRAFT;

    @Column(name = "main_image", length = 500)
    private String mainImage;

    @Column(name = "card_image_position", length = 50)
    private String cardImagePosition = "center center";

    @Column(name = "hero_image_position", length = 50)
    private String heroImagePosition = "center center";

    @Column(name = "hero_fit_mode", length = 50)
    private String heroFitMode = "cover";

    @Column(name = "last_saved_step")
    private Integer lastSavedStep = 1;

    @Column(name = "last_completed_step")
    private Integer lastCompletedStep = 0;

    @Column(name = "last_updated_section", length = 100)
    private String lastUpdatedSection;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    private Long version;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "destination_themes", joinColumns = @JoinColumn(name = "destination_id"))
    @Column(name = "theme_key", length = 50)
    private Set<String> themeKeys = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "destination_highlights", joinColumns = @JoinColumn(name = "destination_id"))
    @OrderColumn(name = "display_order")
    @Column(name = "highlight", length = 255)
    private List<String> highlights = new ArrayList<>();

    @OneToMany(mappedBy = "destination", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    private List<Attraction> attractions = new ArrayList<>();

    public Destination() {}

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Helper methods for attraction list synchronization
    public void addAttraction(Attraction attraction) {
        attractions.add(attraction);
        attraction.setDestination(this);
    }

    public void removeAttraction(Attraction attraction) {
        attractions.remove(attraction);
        attraction.setDestination(null);
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getShortDescription() {
        return shortDescription;
    }

    public void setShortDescription(String shortDescription) {
        this.shortDescription = shortDescription;
    }

    public String getFullDescription() {
        return fullDescription;
    }

    public void setFullDescription(String fullDescription) {
        this.fullDescription = fullDescription;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public DestinationStatus getStatus() {
        return status;
    }

    public void setStatus(DestinationStatus status) {
        this.status = status;
    }

    public Boolean getActive() {
        return status == DestinationStatus.ACTIVE;
    }

    public String getMainImage() {
        return mainImage;
    }

    public void setMainImage(String mainImage) {
        this.mainImage = mainImage;
    }

    public String getCardImagePosition() {
        return cardImagePosition;
    }

    public void setCardImagePosition(String cardImagePosition) {
        this.cardImagePosition = cardImagePosition;
    }

    public String getHeroImagePosition() {
        return heroImagePosition;
    }

    public void setHeroImagePosition(String heroImagePosition) {
        this.heroImagePosition = heroImagePosition;
    }

    public String getHeroFitMode() {
        return heroFitMode;
    }

    public void setHeroFitMode(String heroFitMode) {
        this.heroFitMode = heroFitMode;
    }

    public Integer getLastSavedStep() {
        return lastSavedStep;
    }

    public void setLastSavedStep(Integer lastSavedStep) {
        this.lastSavedStep = lastSavedStep;
    }

    public Integer getLastCompletedStep() {
        return lastCompletedStep;
    }

    public void setLastCompletedStep(Integer lastCompletedStep) {
        this.lastCompletedStep = lastCompletedStep;
    }

    public String getLastUpdatedSection() {
        return lastUpdatedSection;
    }

    public void setLastUpdatedSection(String lastUpdatedSection) {
        this.lastUpdatedSection = lastUpdatedSection;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public Set<String> getThemeKeys() {
        return themeKeys;
    }

    public void setThemeKeys(Set<String> themeKeys) {
        this.themeKeys = themeKeys;
    }

    public List<String> getHighlights() {
        return highlights;
    }

    public void setHighlights(List<String> highlights) {
        this.highlights = highlights;
    }

    public List<Attraction> getAttractions() {
        return attractions;
    }

    public void setAttractions(List<Attraction> attractions) {
        this.attractions = attractions;
    }
}
