// SE2030 LankaStay - Hotel Management
// Functional Owner: Wickramasinghe M.P.T.H - IT25300115

package com.lankastay.backend.controller;

import com.lankastay.backend.dto.hotel.HotelResponse;
import com.lankastay.backend.service.HotelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/hotels")
public class CustomerHotelController {

    private final HotelService hotelService;

    public CustomerHotelController(HotelService hotelService) {
        this.hotelService = hotelService;
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
}
