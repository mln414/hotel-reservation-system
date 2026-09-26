package com.lankastay.backend.dto.review;

import java.time.Instant;
import java.util.List;

public record PublicReviewResponse(
        Long id,
        Long hotelId,
        String hotelName,
        int overallRating,
        Integer cleanlinessRating,
        Integer comfortRating,
        Integer staffServiceRating,
        Integer facilitiesRating,
        Integer locationRating,
        Integer valueForMoneyRating,
        String title,
        String comment,
        List<String> photos,
        String reviewerName,
        boolean verifiedStay,
        String stayMonth,
        String roomName,
        ManagementResponseDTO managementResponse,
        Instant createdAt,
        Instant customerUpdatedAt
) {}
