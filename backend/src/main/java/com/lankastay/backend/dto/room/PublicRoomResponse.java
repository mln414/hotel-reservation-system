package com.lankastay.backend.dto.room;

import com.lankastay.backend.entity.Room;
import com.lankastay.backend.entity.RoomGalleryImage;

import java.util.List;

public record PublicRoomResponse(
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
        List<String> galleryImages
) {
    public static PublicRoomResponse from(Room room, List<RoomGalleryImage> gallery) {
        List<String> images = gallery != null ? gallery.stream().map(RoomGalleryImage::getImageUrl).toList() : List.of();
        return new PublicRoomResponse(
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
                images
        );
    }
}
