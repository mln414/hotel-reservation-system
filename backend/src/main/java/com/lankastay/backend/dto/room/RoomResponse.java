package com.lankastay.backend.dto.room;

import com.lankastay.backend.entity.Room;
import com.lankastay.backend.entity.RoomGalleryImage;

import java.time.LocalDateTime;
import java.util.List;

public record RoomResponse(
        Long id,
        Long hotelId,
        String name,
        String slug,
        String roomCategory,
        String description,
        Integer maxOccupancy,
        Integer maxAdults,
        Integer maxChildren,
        Double sizeSqm,
        String bedType,
        Integer inventoryCount,
        Double basePrice,
        String status,
        String mainImage,
        String amenitiesJson,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean readinessComplete,
        List<String> missingReadinessReasons,
        List<RoomGalleryItemDto> gallery
) {
    public static RoomResponse from(Room room, boolean readinessComplete, List<String> missingReasons, List<RoomGalleryImage> galleryImages) {
        List<RoomGalleryItemDto> galleryDtos = galleryImages != null ? galleryImages.stream()
                .map(img -> new RoomGalleryItemDto(img.getId(), img.getImageUrl(), img.getCaption(), img.getDisplayOrder(), img.getIsCover()))
                .toList() : List.of();

        return new RoomResponse(
                room.getId(),
                room.getHotelId(),
                room.getName(),
                room.getSlug(),
                room.getRoomCategory(),
                room.getDescription(),
                room.getMaxOccupancy(),
                room.getMaxAdults(),
                room.getMaxChildren(),
                room.getSizeSqm(),
                room.getBedType(),
                room.getInventoryCount(),
                room.getBasePrice(),
                room.getStatus(),
                room.getMainImage(),
                room.getAmenitiesJson(),
                room.getCreatedAt(),
                room.getUpdatedAt(),
                readinessComplete,
                missingReasons != null ? missingReasons : List.of(),
                galleryDtos
        );
    }
}
