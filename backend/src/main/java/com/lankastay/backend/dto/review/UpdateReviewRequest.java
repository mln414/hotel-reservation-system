package com.lankastay.backend.dto.review;

import jakarta.validation.constraints.*;
import java.util.List;

public record UpdateReviewRequest(
        @NotNull(message = "Overall rating is required")
        @Min(value = 1, message = "Rating must be between 1 and 5")
        @Max(value = 5, message = "Rating must be between 1 and 5")
        Integer overallRating,

        @Min(value = 1, message = "Category rating must be between 1 and 5")
        @Max(value = 5, message = "Category rating must be between 1 and 5")
        Integer cleanlinessRating,

        @Min(value = 1, message = "Category rating must be between 1 and 5")
        @Max(value = 5, message = "Category rating must be between 1 and 5")
        Integer comfortRating,

        @Min(value = 1, message = "Category rating must be between 1 and 5")
        @Max(value = 5, message = "Category rating must be between 1 and 5")
        Integer staffServiceRating,

        @Min(value = 1, message = "Category rating must be between 1 and 5")
        @Max(value = 5, message = "Category rating must be between 1 and 5")
        Integer facilitiesRating,

        @Min(value = 1, message = "Category rating must be between 1 and 5")
        @Max(value = 5, message = "Category rating must be between 1 and 5")
        Integer locationRating,

        @Min(value = 1, message = "Category rating must be between 1 and 5")
        @Max(value = 5, message = "Category rating must be between 1 and 5")
        Integer valueForMoneyRating,

        @NotBlank(message = "Review title is required")
        @Size(min = 4, max = 120, message = "Review title must be between 4 and 120 characters")
        String title,

        @NotBlank(message = "Review comment is required")
        @Size(min = 20, max = 2000, message = "Review comment must be between 20 and 2000 characters")
        String comment,

        @Size(max = 5, message = "Maximum of 5 photos allowed")
        List<String> photos
) {}
