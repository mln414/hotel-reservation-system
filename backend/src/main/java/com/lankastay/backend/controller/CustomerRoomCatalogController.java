package com.lankastay.backend.controller;

import com.lankastay.backend.dto.room.PublicRoomResponse;
import com.lankastay.backend.entity.Room;
import com.lankastay.backend.entity.RoomGalleryImage;
import com.lankastay.backend.entity.RoomRate;
import com.lankastay.backend.repository.RoomGalleryRepository;
import com.lankastay.backend.repository.RoomRateRepository;
import com.lankastay.backend.repository.RoomRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
public class CustomerRoomCatalogController {

    private final RoomRepository rooms;
    private final RoomRateRepository rates;
    private final RoomGalleryRepository gallery;

    public CustomerRoomCatalogController(RoomRepository rooms, RoomRateRepository rates, RoomGalleryRepository gallery) {
        this.rooms = rooms;
        this.rates = rates;
        this.gallery = gallery;
    }

    @GetMapping("/rooms")
    public List<PublicRoomResponse> rooms() {
        List<Room> bookable = rooms.findCustomerBookableRooms();
        return bookable.stream().filter(this::isCustomerReady).map(room -> {
            List<RoomGalleryImage> images = gallery.findByRoomIdOrderByDisplayOrderAscIdAsc(room.getId());
            return PublicRoomResponse.from(room, images);
        }).toList();
    }

    private boolean isCustomerReady(Room room) {
        boolean basic = room.getName() != null && !room.getName().isBlank()
                && room.getDescription() != null && !room.getDescription().isBlank()
                && room.getMaxOccupancy() != null && room.getMaxOccupancy() > 0
                && room.getMaxAdults() != null && room.getMaxAdults() > 0;
        boolean image = room.getMainImage() != null && !room.getMainImage().isBlank();
        boolean inventory = room.getInventoryCount() != null && room.getInventoryCount() > 0;
        boolean rate = !rates.findByRoomIdAndStatus(room.getId(), "ACTIVE").isEmpty();
        return basic && image && inventory && rate;
    }

    @GetMapping("/room-rates")
    public List<RoomRate> rates() {
        return rates.findCustomerBookableRates();
    }
}
