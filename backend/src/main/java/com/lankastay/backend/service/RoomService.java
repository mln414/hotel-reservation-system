package com.lankastay.backend.service;

import com.lankastay.backend.entity.Room;
import com.lankastay.backend.repository.RoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class RoomService {

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Transactional(readOnly = true)
    public List<Room> getRoomsForHotel(Long hotelId) {
        if (hotelId == null) {
            return roomRepository.findAll();
        }
        return roomRepository.findByHotelId(hotelId);
    }

    @Transactional(readOnly = true)
    public Optional<Room> getRoomById(Long id) {
        return roomRepository.findById(id);
    }

    @Transactional
    public Room createRoom(Room room) {
        if (room.getStatus() == null) {
            room.setStatus("ACTIVE");
        }
        return roomRepository.save(room);
    }

    @Transactional
    public Room updateRoom(Long id, Room updated) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Room not found with ID: " + id));

        room.setName(updated.getName());
        room.setSlug(updated.getSlug());
        room.setRoomCategory(updated.getRoomCategory());
        room.setDescription(updated.getDescription());
        room.setMaxOccupancy(updated.getMaxOccupancy());
        room.setMaxAdults(updated.getMaxAdults());
        room.setMaxChildren(updated.getMaxChildren());
        room.setSizeSqm(updated.getSizeSqm());
        room.setBedType(updated.getBedType());
        room.setInventoryCount(updated.getInventoryCount());
        room.setBasePrice(updated.getBasePrice());
        room.setStatus(updated.getStatus());
        room.setMainImage(updated.getMainImage());
        room.setAmenitiesJson(updated.getAmenitiesJson());

        return roomRepository.save(room);
    }

    /**
     * Updates only the amenity list for a room, without touching the rest of the
     * room's details.
     */
    @Transactional
    public Room updateRoomAmenities(Long id, List<String> amenities) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Room not found with ID: " + id));
        room.setAmenities(amenities);
        return roomRepository.save(room);
    }

    @Transactional
    public void deleteRoom(Long id) {
        roomRepository.deleteById(id);
    }
}
