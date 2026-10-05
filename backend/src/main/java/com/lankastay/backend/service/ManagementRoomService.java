package com.lankastay.backend.service;

import com.lankastay.backend.dto.room.CreateRoomRequest;
import com.lankastay.backend.dto.room.RoomGalleryItemDto;
import com.lankastay.backend.dto.room.RoomResponse;
import com.lankastay.backend.dto.room.RoomStatusRequest;
import com.lankastay.backend.dto.room.UpdateRoomRequest;
import com.lankastay.backend.entity.Hotel;
import com.lankastay.backend.entity.Reservation;
import com.lankastay.backend.entity.Room;
import com.lankastay.backend.entity.RoomGalleryImage;
import com.lankastay.backend.entity.RoomRate;
import com.lankastay.backend.entity.SecurityEventType;
import com.lankastay.backend.exception.BusinessRuleException;
import com.lankastay.backend.exception.ConflictException;
import com.lankastay.backend.exception.ResourceNotFoundException;
import com.lankastay.backend.repository.HotelRepository;
import com.lankastay.backend.repository.ReservationItemRepository;
import com.lankastay.backend.repository.RoomGalleryRepository;
import com.lankastay.backend.repository.RoomRateRepository;
import com.lankastay.backend.repository.RoomRepository;
import com.lankastay.backend.repository.PhysicalRoomRepository;
import com.lankastay.backend.repository.OfferRepository;
import com.lankastay.backend.repository.PhysicalRoomBlockRepository;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.SecurityAuditService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class ManagementRoomService {

    private final RoomRepository roomRepository;
    private final HotelRepository hotelRepository;
    private final RoomRateRepository roomRateRepository;
    private final ReservationItemRepository reservationItemRepository;
    private final RoomGalleryRepository roomGalleryRepository;
    private final SecurityAuditService audit;
    private final PhysicalRoomRepository physicalRoomRepository;
    private final OfferRepository offerRepository;
    private final PhysicalRoomBlockRepository physicalRoomBlockRepository;

    public ManagementRoomService(
            RoomRepository roomRepository,
            HotelRepository hotelRepository,
            RoomRateRepository roomRateRepository,
            ReservationItemRepository reservationItemRepository,
            RoomGalleryRepository roomGalleryRepository,
            SecurityAuditService audit,
            PhysicalRoomRepository physicalRoomRepository,
            OfferRepository offerRepository,
            PhysicalRoomBlockRepository physicalRoomBlockRepository
    ) {
        this.roomRepository = roomRepository;
        this.hotelRepository = hotelRepository;
        this.roomRateRepository = roomRateRepository;
        this.reservationItemRepository = reservationItemRepository;
        this.roomGalleryRepository = roomGalleryRepository;
        this.audit = audit;
        this.physicalRoomRepository = physicalRoomRepository;
        this.offerRepository = offerRepository;
        this.physicalRoomBlockRepository = physicalRoomBlockRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getRooms(StaffPrincipal principal, Long requestedHotelId) {
        Long effectiveHotelId = requestedHotelId;
        if (!"MANAGER".equalsIgnoreCase(principal.role())) {
            effectiveHotelId = principal.assignedHotelId();
            if (effectiveHotelId == null) throw new AccessDeniedException("No hotel is assigned to this staff account.");
        } else if (principal.assignedHotelId() != null) {
            if (requestedHotelId != null && !requestedHotelId.equals(principal.assignedHotelId()))
                throw new AccessDeniedException("Cannot access another hotel's rooms.");
            effectiveHotelId = principal.assignedHotelId();
        }

        List<Room> rooms;
        if (effectiveHotelId != null) {
            rooms = roomRepository.findByHotelId(effectiveHotelId);
        } else {
            rooms = roomRepository.findAll();
        }

        return rooms.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public RoomResponse getRoomById(StaffPrincipal principal, Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + id));

        if (principal.assignedHotelId() != null && !room.getHotelId().equals(principal.assignedHotelId())) {
            throw new AccessDeniedException("Staff cannot access rooms belonging to another hotel.");
        }
        if (!"MANAGER".equalsIgnoreCase(principal.role()) && principal.assignedHotelId() == null)
            throw new AccessDeniedException("No hotel is assigned to this staff account.");

        return toResponse(room);
    }

    @Transactional
    public RoomResponse createRoom(StaffPrincipal principal, CreateRoomRequest request) {
        if (!"MANAGER".equalsIgnoreCase(principal.role())) {
            throw new AccessDeniedException("Only managers can create room types.");
        }

        Hotel hotel = hotelRepository.findById(request.hotelId())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: " + request.hotelId()));
        if (principal.assignedHotelId() != null && !principal.assignedHotelId().equals(request.hotelId()))
            throw new AccessDeniedException("Cannot create a room type for another hotel.");

        if (roomRepository.existsByHotelIdAndNameIgnoreCase(request.hotelId(), request.name().trim())) {
            throw new ConflictException("A room type with name '" + request.name().trim() + "' already exists in this hotel.");
        }

        String slug = generateUniqueSlug(request.hotelId(), request.name(), null);

        Room room = new Room();
        room.setHotelId(request.hotelId());
        room.setName(request.name().trim());
        room.setSlug(slug);
        room.setRoomCategory(request.roomCategory().trim());
        room.setDescription(request.description() != null ? request.description().trim() : null);
        room.setMaxOccupancy(request.maxOccupancy());
        room.setMaxAdults(request.maxAdults());
        room.setMaxChildren(request.maxChildren());
        room.setSizeSqm(request.sizeSqm());
        room.setBedType(request.bedType() != null ? request.bedType().trim() : null);
        room.setInventoryCount(request.inventoryCount());
        room.setBasePrice(request.basePrice() != null ? request.basePrice() : 0.0);
        room.setStatus("INACTIVE"); // newly created rooms start inactive until activated
        room.setMainImage(request.mainImage() != null ? request.mainImage().trim() : null);
        room.setAmenitiesJson(request.amenitiesJson());

        Room saved = roomRepository.save(room);

        // Save gallery if provided
        if (request.gallery() != null && !request.gallery().isEmpty()) {
            syncGallery(saved.getId(), request.gallery(), saved.getMainImage());
        }

        audit.record(principal.id(), null, SecurityEventType.ROOM_CREATED, null, "SUCCESS");
        return toResponse(saved);
    }

    @Transactional
    public RoomResponse updateRoom(StaffPrincipal principal, Long id, UpdateRoomRequest request) {
        Room room = roomRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + id));

        if (!"MANAGER".equalsIgnoreCase(principal.role()) && !room.getHotelId().equals(principal.assignedHotelId())) {
            throw new AccessDeniedException("Staff cannot modify rooms belonging to another hotel.");
        }
        if (principal.assignedHotelId() != null && !room.getHotelId().equals(principal.assignedHotelId()))
            throw new AccessDeniedException("Cannot modify a room type for another hotel.");

        if (roomRepository.existsByHotelIdAndNameIgnoreCaseAndIdNot(room.getHotelId(), request.name().trim(), id)) {
            throw new ConflictException("A room type with name '" + request.name().trim() + "' already exists in this hotel.");
        }

        // Concurrency-safe inventory reduction protection against future overbooking
        if (request.inventoryCount() < room.getInventoryCount()) {
            if (request.inventoryCount() < physicalRoomRepository.countByRoomTypeId(id))
                throw new ConflictException("Inventory cannot be lower than the number of configured physical rooms.");
            List<Reservation> futureReservations = reservationItemRepository.findActiveFutureReservationsForRoom(id, LocalDate.now());
            int blocked = Math.toIntExact(physicalRoomRepository.countByRoomTypeIdAndBaseOperationalStatusNot(id, "AVAILABLE"));
            int maxBooked = calculateMaxFutureBookedQuantity(id, futureReservations);
            if (request.inventoryCount() - blocked < maxBooked) {
                throw new ConflictException("Inventory cannot be reduced below the quantity already reserved for future stays (" + maxBooked + " rooms reserved).");
            }
            Set<LocalDate> nights = new HashSet<>();
            for (Reservation res : futureReservations) {
                for (LocalDate night = res.getCheckIn().isBefore(LocalDate.now()) ? LocalDate.now() : res.getCheckIn();
                     night.isBefore(res.getCheckOut()); night = night.plusDays(1)) nights.add(night);
            }
            for (LocalDate night : nights) {
                long capacity = request.inventoryCount() - blocked - physicalRoomBlockRepository.countBlockedForNight(id, night);
                if (reservationItemRepository.bookedQuantityForNight(id, night) > capacity)
                    throw new ConflictException("Inventory cannot be reduced below confirmed demand and scheduled restrictions on " + night + ".");
            }
        }

        // Capacity reduction protection
        List<Reservation> futureReservations = reservationItemRepository.findActiveFutureReservationsForRoom(id, LocalDate.now());
        for (Reservation res : futureReservations) {
            if (res.getAdults() > request.maxAdults() || (res.getAdults() + res.getChildren()) > request.maxOccupancy()) {
                throw new ConflictException("Capacity cannot be reduced below guest counts in existing future reservations.");
            }
        }

        if (!room.getName().equalsIgnoreCase(request.name().trim())) {
            room.setSlug(generateUniqueSlug(room.getHotelId(), request.name(), id));
        }

        room.setName(request.name().trim());
        room.setRoomCategory(request.roomCategory().trim());
        room.setDescription(request.description() != null ? request.description().trim() : null);
        room.setMaxOccupancy(request.maxOccupancy());
        room.setMaxAdults(request.maxAdults());
        room.setMaxChildren(request.maxChildren());
        room.setSizeSqm(request.sizeSqm());
        room.setBedType(request.bedType() != null ? request.bedType().trim() : null);
        room.setInventoryCount(request.inventoryCount());
        if (request.basePrice() != null) {
            room.setBasePrice(request.basePrice());
        }
        room.setMainImage(request.mainImage() != null ? request.mainImage().trim() : null);
        room.setAmenitiesJson(request.amenitiesJson());

        Room saved = roomRepository.save(room);

        // Update gallery if supplied
        if (request.gallery() != null) {
            syncGallery(saved.getId(), request.gallery(), saved.getMainImage());
        }

        audit.record(principal.id(), null, SecurityEventType.ROOM_UPDATED, null, "SUCCESS");
        return toResponse(saved);
    }

    @Transactional
    public RoomResponse updateStatus(StaffPrincipal principal, Long id, RoomStatusRequest request) {
        if (!"MANAGER".equalsIgnoreCase(principal.role())) {
            throw new AccessDeniedException("Only managers can change room status.");
        }

        Room room = roomRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + id));

        if (principal.assignedHotelId() != null && !room.getHotelId().equals(principal.assignedHotelId()))
            throw new AccessDeniedException("Cannot change a room type for another hotel.");

        String targetStatus = request.status().trim().toUpperCase();
        if ("ACTIVE".equalsIgnoreCase(targetStatus)) {
            RoomReadiness readiness = evaluateReadiness(room);
            if (!readiness.complete()) {
                throw new BusinessRuleException("Cannot activate room. Requirements missing: " + String.join("; ", readiness.reasons()));
            }
        }

        room.setStatus(targetStatus);
        Room saved = roomRepository.save(room);

        SecurityEventType eventType = "ACTIVE".equalsIgnoreCase(targetStatus) ? SecurityEventType.ROOM_ACTIVATED : SecurityEventType.ROOM_DEACTIVATED;
        audit.record(principal.id(), null, eventType, null, "SUCCESS");
        return toResponse(saved);
    }

    @Transactional
    public void deleteRoom(StaffPrincipal principal, Long id) {
        if (!"MANAGER".equalsIgnoreCase(principal.role())) {
            throw new AccessDeniedException("Only managers can delete rooms.");
        }

        Room room = roomRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + id));

        // Defense-in-depth: verify hotel ownership even for managers
        if (principal.assignedHotelId() != null && !room.getHotelId().equals(principal.assignedHotelId())) {
            throw new AccessDeniedException("Cannot delete a room belonging to another hotel.");
        }

        if (reservationItemRepository.existsByRoomId(id)) {
            throw new ConflictException("This room cannot be deleted because reservation history exists. Deactivate it instead.");
        }
        if (physicalRoomRepository.existsByRoomTypeId(id)) {
            throw new ConflictException("Delete the configured physical rooms before deleting this room type.");
        }
        if (offerRepository.countTargetingRoomType(id) > 0) {
            throw new ConflictException("An offer targets this room type. Remove the offer link before deleting it.");
        }

        List<RoomRate> rates = roomRateRepository.findByRoomId(id);
        for (RoomRate rate : rates) {
            if (reservationItemRepository.existsByRoomRateId(rate.getId())) {
                throw new ConflictException("This room cannot be deleted because reservation history exists. Deactivate it instead.");
            }
        }

        roomRateRepository.deleteAll(rates);
        roomRateRepository.flush();
        roomGalleryRepository.deleteByRoomId(id);
        roomGalleryRepository.flush();
        roomRepository.delete(room);
        roomRepository.flush();

        audit.record(principal.id(), null, SecurityEventType.ROOM_DELETED, null, "SUCCESS");
    }

    private void syncGallery(Long roomId, List<RoomGalleryItemDto> dtos, String mainImage) {
        roomGalleryRepository.deleteByRoomId(roomId);
        int order = 0;
        for (RoomGalleryItemDto dto : dtos) {
            if (dto.imageUrl() == null || dto.imageUrl().isBlank()) continue;
            boolean isCover = (mainImage != null && mainImage.equals(dto.imageUrl())) || Boolean.TRUE.equals(dto.isCover());
            RoomGalleryImage img = new RoomGalleryImage(
                    roomId,
                    dto.imageUrl().trim(),
                    dto.caption() != null ? dto.caption().trim() : null,
                    dto.displayOrder() != null ? dto.displayOrder() : order++,
                    isCover
            );
            roomGalleryRepository.save(img);
        }
    }

    private int calculateMaxFutureBookedQuantity(Long roomId, List<Reservation> futureReservations) {
        if (futureReservations.isEmpty()) return 0;

        Set<LocalDate> stayNights = new HashSet<>();
        LocalDate today = LocalDate.now();
        for (Reservation res : futureReservations) {
            LocalDate night = res.getCheckIn().isBefore(today) ? today : res.getCheckIn();
            while (night.isBefore(res.getCheckOut())) {
                stayNights.add(night);
                night = night.plusDays(1);
            }
        }

        long maxBooked = 0;
        for (LocalDate night : stayNights) {
            long booked = reservationItemRepository.bookedQuantityForNight(roomId, night);
            if (booked > maxBooked) {
                maxBooked = booked;
            }
        }
        return (int) maxBooked;
    }

    private RoomReadiness evaluateReadiness(Room room) {
        List<String> reasons = new ArrayList<>();

        Optional<Hotel> hotelOpt = hotelRepository.findById(room.getHotelId());
        if (hotelOpt.isEmpty()) {
            reasons.add("Assigned hotel does not exist");
        } else {
            Hotel hotel = hotelOpt.get();
            if (!"ACTIVE".equalsIgnoreCase(hotel.getStatus())) {
                reasons.add("Hotel operational status is not ACTIVE");
            }
            if (!"ACTIVE".equalsIgnoreCase(hotel.getPublicationStatus())) {
                reasons.add("Hotel publication status is not ACTIVE");
            }
        }

        if (room.getInventoryCount() == null || room.getInventoryCount() <= 0) {
            reasons.add("Inventory count must be greater than 0");
        }

        if (room.getName() == null || room.getName().isBlank()
                || room.getDescription() == null || room.getDescription().isBlank()
                || room.getMaxOccupancy() == null || room.getMaxOccupancy() < 1
                || room.getMaxAdults() == null || room.getMaxAdults() < 1) {
            reasons.add("Required room type information is incomplete");
        }

        if (room.getMainImage() == null || room.getMainImage().isBlank()) {
            reasons.add("A main cover photo is required");
        }

        List<RoomRate> rates = roomRateRepository.findByRoomId(room.getId());
        boolean hasActiveRate = rates.stream().anyMatch(r -> "ACTIVE".equalsIgnoreCase(r.getStatus()));
        if (!hasActiveRate) {
            reasons.add("At least one active room rate is required");
        }

        return new RoomReadiness(reasons.isEmpty(), reasons);
    }

    private RoomResponse toResponse(Room room) {
        RoomReadiness readiness = evaluateReadiness(room);
        List<RoomGalleryImage> gallery = roomGalleryRepository.findByRoomIdOrderByDisplayOrderAscIdAsc(room.getId());
        return RoomResponse.from(room, readiness.complete(), readiness.reasons(), gallery);
    }

    private String generateUniqueSlug(Long hotelId, String name, Long currentRoomId) {
        String baseSlug = name.trim().toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
        if (baseSlug.isBlank()) {
            baseSlug = "room";
        }

        String candidate = baseSlug;
        int counter = 2;
        while (slugExists(hotelId, candidate, currentRoomId)) {
            candidate = baseSlug + "-" + counter++;
        }
        return candidate;
    }

    private boolean slugExists(Long hotelId, String slug, Long currentRoomId) {
        if (currentRoomId == null) {
            return roomRepository.existsByHotelIdAndSlug(hotelId, slug);
        }
        return roomRepository.existsByHotelIdAndSlugAndIdNot(hotelId, slug, currentRoomId);
    }

    private record RoomReadiness(boolean complete, List<String> reasons) {}
}
