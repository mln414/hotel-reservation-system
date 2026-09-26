package com.lankastay.backend.dto.room;

public record RoomGalleryItemDto(
        Long id,
        String imageUrl,
        String caption,
        Integer displayOrder,
        Boolean isCover
) {}
