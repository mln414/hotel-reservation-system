// SE2030 LankaStay - Hotel Management
// Functional Owner: Wickramasinghe M.P.T.H - IT25300115

package com.lankastay.backend.dto.hotel;

import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record UpdateHotelRequest(
        @Size(max = 150, message = "Hotel name cannot exceed 150 characters")
        String name,

        Long destinationId,

        @Size(max = 50, message = "Property type cannot exceed 50 characters")
        String propertyType,

        String category,
        BigDecimal price,
        String mainImage,
        String badge,
        Boolean featured,
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
        List<String> collectionIds
) {}
