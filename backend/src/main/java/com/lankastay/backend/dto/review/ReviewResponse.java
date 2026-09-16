// SE2030 LankaStay - Customer Review Management and Moderation
package com.lankastay.backend.dto.review;

import com.lankastay.backend.entity.Review;
import com.lankastay.backend.entity.ReviewStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ReviewResponse(
        Long id,
        Long hotelId,
        String hotelName,
        UUID customerId,
        Long reservationId,
        String guestName,
        Double rating,
        Double cleanlinessRating,
        Double staffRating,
        Double facilitiesRating,
        Double locationRating,
        Double valueRating,
        String title,
        String comment,
        String tripType,
        String roomType,
        ReviewStatus status,
        String moderationNote,
        boolean isVerifiedStay,
        int helpfulCount,
        String managementReply,
        String repliedByName,
        LocalDateTime repliedAt,
        List<String> images,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ReviewResponse from(Review r, String hotelName) {
        return new ReviewResponse(
                r.getId(),
                r.getHotelId(),
                hotelName,
                r.getCustomerId(),
                r.getReservationId(),
                r.getGuestName(),
                r.getRating(),
                r.getCleanlinessRating(),
                r.getStaffRating(),
                r.getFacilitiesRating(),
                r.getLocationRating(),
                r.getValueRating(),
                r.getTitle(),
                r.getComment(),
                r.getTripType(),
                r.getRoomType(),
                r.getStatus(),
                r.getModerationNote(),
                r.isVerifiedStay(),
                r.getHelpfulCount(),
                r.getManagementReply(),
                r.getRepliedByName(),
                r.getRepliedAt(),
                r.getImages(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }
}
