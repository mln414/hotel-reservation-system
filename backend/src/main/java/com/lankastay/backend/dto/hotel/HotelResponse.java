// SE2030 LankaStay - Hotel Management
// Functional Owner: Wickramasinghe M.P.T.H - IT25300115

package com.lankastay.backend.dto.hotel;

import com.lankastay.backend.entity.Hotel;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record HotelResponse(
        Long id,
        String name,
        String slug,
        Long destinationId,
        String destinationName,
        String propertyType,
        String category,
        double rating,
        int reviewCount,
        BigDecimal price,
        String mainImage,
        String image,
        String badge,
        boolean featured,
        String status,
        String setupStatus,
        String publicationStatus,
        String shortDescription,
        String detailDescription,
        String tagline,
        String checkInTime,
        String checkOutTime,
        String address,
        String city,
        String province,
        String postalCode,
        String email,
        String phone,
        String website,
        Double latitude,
        Double longitude,
        Integer yearOpened,
        String propertySize,
        String languages,
        String videoUrl,
        List<HotelPolicyRecord> policyRecords,
        String lastUpdatedSection,
        List<String> facilities,
        List<String> gallery,
        List<String> collectionIds,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static HotelResponse from(Hotel hotel, String destinationName) {
        String mainImg = hotel.getMainImage() != null ? hotel.getMainImage() : "";
        return new HotelResponse(
                hotel.getId(),
                hotel.getName(),
                hotel.getSlug(),
                hotel.getDestinationId(),
                destinationName,
                hotel.getPropertyType(),
                hotel.getCategory(),
                hotel.getRating(),
                hotel.getReviewCount(),
                hotel.getPrice(),
                mainImg,
                mainImg,
                hotel.getBadge(),
                hotel.isFeatured(),
                hotel.getStatus(),
                hotel.getSetupStatus(),
                hotel.getPublicationStatus(),
                hotel.getShortDescription(),
                hotel.getDetailDescription(),
                hotel.getTagline(),
                hotel.getCheckInTime(),
                hotel.getCheckOutTime(),
                hotel.getAddress(),
                hotel.getCity(),
                hotel.getProvince(),
                hotel.getPostalCode(),
                hotel.getEmail(),
                hotel.getPhone(),
                hotel.getWebsite(),
                hotel.getLatitude(),
                hotel.getLongitude(),
                hotel.getYearOpened(),
                hotel.getPropertySize(),
                hotel.getLanguages(),
                hotel.getVideoUrl(),
                HotelPolicyJson.read(hotel.getPoliciesJson()),
                hotel.getLastUpdatedSection(),
                hotel.getFacilities() != null ? hotel.getFacilities() : List.of(),
                hotel.getGallery() != null ? hotel.getGallery() : List.of(),
                hotel.getCollectionIds() != null ? hotel.getCollectionIds() : List.of(),
                hotel.getCreatedAt(),
                hotel.getUpdatedAt()
        );
    }
}
