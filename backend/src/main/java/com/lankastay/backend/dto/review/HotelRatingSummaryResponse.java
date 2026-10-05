package com.lankastay.backend.dto.review;

import java.util.List;
import java.util.Map;

public record HotelRatingSummaryResponse(
        Long hotelId,
        Double averageRating,
        long reviewCount,
        List<RatingDistributionItem> distribution,
        Map<String, Double> categoryAverages
) {
    public record RatingDistributionItem(
            int rating,
            long count,
            double percentage
    ) {}
}
