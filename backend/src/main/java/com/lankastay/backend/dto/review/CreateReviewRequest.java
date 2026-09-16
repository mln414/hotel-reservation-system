// SE2030 LankaStay - Customer Review Management and Moderation
package com.lankastay.backend.dto.review;

import jakarta.validation.constraints.*;
import java.util.List;

public record CreateReviewRequest(
        @NotNull(message = "Hotel ID is required")
        Long hotelId,

        @NotBlank(message = "Guest name is required")
        @Size(max = 150, message = "Guest name must not exceed 150 characters")
        String guestName,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        @Size(max = 150, message = "Email must not exceed 150 characters")
        String guestEmail,

        @NotNull(message = "Overall rating is required")
        @DecimalMin(value = "1.0", message = "Rating must be at least 1.0")
        @DecimalMax(value = "5.0", message = "Rating must not exceed 5.0")
        Double rating,

        @DecimalMin(value = "1.0", message = "Cleanliness rating must be at least 1.0")
        @DecimalMax(value = "5.0", message = "Cleanliness rating must not exceed 5.0")
        Double cleanlinessRating,

        @DecimalMin(value = "1.0", message = "Staff rating must be at least 1.0")
        @DecimalMax(value = "5.0", message = "Staff rating must not exceed 5.0")
        Double staffRating,

        @DecimalMin(value = "1.0", message = "Facilities rating must be at least 1.0")
        @DecimalMax(value = "5.0", message = "Facilities rating must not exceed 5.0")
        Double facilitiesRating,

        @DecimalMin(value = "1.0", message = "Location rating must be at least 1.0")
        @DecimalMax(value = "5.0", message = "Location rating must not exceed 5.0")
        Double locationRating,

        @DecimalMin(value = "1.0", message = "Value rating must be at least 1.0")
        @DecimalMax(value = "5.0", message = "Value rating must not exceed 5.0")
        Double valueRating,

        @NotBlank(message = "Review title is required")
        @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
        String title,

        @NotBlank(message = "Review comment is required")
        @Size(min = 10, max = 3000, message = "Comment must be between 10 and 3000 characters")
        String comment,

        String tripType,
        String roomType,
        Long reservationId,
        List<String> images
) {}
