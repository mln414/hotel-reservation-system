// SE2030 LankaStay - Customer Review Management and Moderation
package com.lankastay.backend.dto.review;

import java.util.Map;

public record ReviewSummaryResponse(
        Long hotelId,
        String hotelName,
        double averageRating,
        long totalReviews,
        double averageCleanliness,
        double averageStaff,
        double averageFacilities,
        double averageLocation,
        double averageValue,
        Map<Integer, Long> starCounts,
        Map<Integer, Double> starPercentages
) {}
