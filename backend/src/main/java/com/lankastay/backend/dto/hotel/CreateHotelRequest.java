// SE2030 LankaStay - Hotel Management
// Functional Owner: Wickramasinghe M.P.T.H - IT25300115

package com.lankastay.backend.dto.hotel;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record CreateHotelRequest(
        @NotBlank(message = "Hotel name is required")
        @Size(max = 150, message = "Hotel name cannot exceed 150 characters")
        String name,

        @NotNull(message = "Destination ID is required")
        Long destinationId,

        @NotBlank(message = "Property type is required")
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
        List<String> facilities,
        List<String> gallery,
        List<String> collectionIds
) {}
