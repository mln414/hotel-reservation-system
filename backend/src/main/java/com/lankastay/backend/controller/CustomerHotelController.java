// SE2030 LankaStay - Hotel Management
// Functional Owner: Wickramasinghe M.P.T.H - IT25300115

package com.lankastay.backend.controller;

import com.lankastay.backend.dto.hotel.HotelResponse;
import com.lankastay.backend.service.HotelService;
import com.lankastay.backend.entity.Room;
import com.lankastay.backend.entity.RoomRate;
import com.lankastay.backend.repository.RoomRepository;
import com.lankastay.backend.repository.RoomRateRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/hotels")
public class CustomerHotelController {

    private final HotelService hotelService;
    private final RoomRepository roomRepository;
    private final RoomRateRepository roomRateRepository;

    public CustomerHotelController(HotelService hotelService, RoomRepository roomRepository, RoomRateRepository roomRateRepository) {
        this.hotelService = hotelService;
        this.roomRepository = roomRepository;
        this.roomRateRepository = roomRateRepository;
    }

    /**
     * Public Read-Only Endpoint: Fetch all active customer hotels
     * GET /api/public/hotels
     */
    @GetMapping
    public ResponseEntity<List<HotelResponse>> getPublicActiveHotels() {
        List<HotelResponse> list = hotelService.getActiveHotels();
        return ResponseEntity.ok(list);
    }

    /**
     * Public Read-Only Endpoint: Fetch single active hotel by ID or slug
     * GET /api/public/hotels/{identifier}
     */
    @GetMapping("/{identifier}")
    public ResponseEntity<HotelResponse> getHotelByIdOrSlug(@PathVariable String identifier) {
        HotelResponse hotel = hotelService.getActiveHotelBySlugOrId(identifier);
        return ResponseEntity.ok(hotel);
    }

    /**
     * Public Read-Only Endpoint: Fetch active hotels for a specific destination
     * GET /api/public/hotels/destination/{destinationId}
     */
    @GetMapping("/destination/{destinationId}")
    public ResponseEntity<List<HotelResponse>> getHotelsByDestination(@PathVariable Long destinationId) {
        List<HotelResponse> list = hotelService.getActiveHotelsByDestination(destinationId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{hotelId}/rooms")
    public List<Room> getActiveRooms(@PathVariable Long hotelId) {
        hotelService.getActiveHotelBySlugOrId(String.valueOf(hotelId));
        return roomRepository.findByHotelIdAndStatus(hotelId, "ACTIVE");
    }

    @GetMapping("/{hotelId}/rooms/{roomId}/rates")
    public List<RoomRate> getActiveRates(@PathVariable Long hotelId, @PathVariable Long roomId) {
        hotelService.getActiveHotelBySlugOrId(String.valueOf(hotelId));
        return roomRateRepository.findByHotelIdAndRoomIdAndStatus(hotelId, roomId, "ACTIVE");
    }
}
