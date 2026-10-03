package com.lankastay.backend.dto.room;

import jakarta.validation.constraints.*;
import java.util.List;

public record UpdateRoomRequest(
        @NotBlank(message = "Room name is required")
        @Size(max = 150, message = "Room name must not exceed 150 characters")
        String name,

        @NotBlank(message = "Room category is required")
        @Size(max = 50, message = "Room category must not exceed 50 characters")
        String roomCategory,

        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        String description,

        @NotNull(message = "Maximum occupancy is required")
        @Min(value = 1, message = "Maximum occupancy must be at least 1")
        Integer maxOccupancy,

        @NotNull(message = "Maximum adults is required")
        @Min(value = 1, message = "Maximum adults must be at least 1")
        Integer maxAdults,

        @NotNull(message = "Maximum children is required")
        @Min(value = 0, message = "Maximum children cannot be negative")
        Integer maxChildren,

        @Positive(message = "Size in square meters must be positive")
        Double sizeSqm,

        @Size(max = 50, message = "Bed type must not exceed 50 characters")
        String bedType,

        @NotNull(message = "Inventory count is required")
        @Min(value = 1, message = "Inventory count must be at least 1")
        Integer inventoryCount,

        @PositiveOrZero(message = "Base price cannot be negative")
        Double basePrice,

        @Size(max = 500, message = "Main image URL must not exceed 500 characters")
        String mainImage,

        String amenitiesJson,

        List<RoomGalleryItemDto> gallery
) {}
