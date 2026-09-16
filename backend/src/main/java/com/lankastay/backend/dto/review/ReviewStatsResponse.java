// SE2030 LankaStay - Customer Review Management and Moderation
package com.lankastay.backend.dto.review;

public record ReviewStatsResponse(
        long totalReviews,
        long pendingReviews,
        long approvedReviews,
        long rejectedReviews,
        long flaggedReviews,
        double averageRating
) {}
