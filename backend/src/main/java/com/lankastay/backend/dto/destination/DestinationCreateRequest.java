package com.lankastay.backend.dto.destination;

import com.lankastay.backend.dto.attraction.AttractionCreateRequest;
import com.lankastay.backend.entity.DestinationStatus;
import jakarta.validation.constraints.*;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class DestinationCreateRequest {

    @NotBlank(message = "Destination Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @Size(max = 120, message = "Slug must not exceed 120 characters")
    private String slug;

    @NotBlank(message = "Short Description is required")
    @Size(max = 220, message = "Short Description must not exceed 220 characters")
    private String shortDescription;

    private String fullDescription;
    private String category;

    private String region;

    private String district;

    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90.0")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90.0")
    private Double latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180.0")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180.0")
    private Double longitude;

    private DestinationStatus status = DestinationStatus.DRAFT;
    private String mainImage;
    private String cardImagePosition = "center center";
    private String heroImagePosition = "center center";
    private String heroFitMode = "cover";

    private Integer lastSavedStep = 1;
    private Integer lastCompletedStep = 0;
    private String lastUpdatedSection;

    private Set<String> themeKeys = new HashSet<>();
    private List<String> highlights = new ArrayList<>();
    private List<AttractionCreateRequest> attractions = new ArrayList<>();

    public DestinationCreateRequest() {}

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

    public List<AttractionCreateRequest> getAttractions() {
        return attractions;
    }

    public void setAttractions(List<AttractionCreateRequest> attractions) {
        this.attractions = attractions;
    }
}
