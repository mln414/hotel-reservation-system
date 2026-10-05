package com.lankastay.backend.service;

import com.lankastay.backend.dto.room.PhysicalRoomRequest;
import com.lankastay.backend.dto.room.PhysicalRoomResponse;
import com.lankastay.backend.dto.room.PhysicalRoomBlockRequest;
import com.lankastay.backend.dto.room.PhysicalRoomBlockResponse;
import com.lankastay.backend.dto.room.PhysicalRoomBlockBatchRequest;
import com.lankastay.backend.dto.room.PhysicalRoomStatusBatchRequest;
import com.lankastay.backend.entity.PhysicalRoom;
import com.lankastay.backend.entity.PhysicalRoomBlock;
import com.lankastay.backend.entity.Reservation;
import com.lankastay.backend.entity.Room;
import com.lankastay.backend.exception.ConflictException;
import com.lankastay.backend.exception.ResourceNotFoundException;
import com.lankastay.backend.repository.PhysicalRoomRepository;
import com.lankastay.backend.repository.PhysicalRoomBlockRepository;
import com.lankastay.backend.repository.ReservationItemRepository;
import com.lankastay.backend.repository.ReservationRepository;
import com.lankastay.backend.repository.RoomRepository;
import com.lankastay.backend.repository.ReservationPhysicalRoomRepository;
import com.lankastay.backend.security.StaffPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import java.time.LocalDate;
import java.util.*;

@Service
public class PhysicalRoomService {
    private final PhysicalRoomRepository physicalRooms;
    private final RoomRepository roomTypes;
    private final PhysicalRoomBlockRepository blocks;
    private final ReservationRepository reservations;
    private final ReservationItemRepository items;
    private final ReservationPhysicalRoomRepository assignments;

    public PhysicalRoomService(PhysicalRoomRepository physicalRooms, RoomRepository roomTypes,
                               ReservationRepository reservations, ReservationItemRepository items,
                               PhysicalRoomBlockRepository blocks, ReservationPhysicalRoomRepository assignments) {
        this.physicalRooms = physicalRooms;
        this.roomTypes = roomTypes;
        this.reservations = reservations;
        this.items = items;
        this.blocks = blocks;
        this.assignments = assignments;
    }

    @Transactional(readOnly = true)
    public List<PhysicalRoomResponse> list(StaffPrincipal principal, Long hotelId) {
        Long scope = manager(principal) ? hotelId : principal.assignedHotelId();
        if (manager(principal) && principal.assignedHotelId() != null) {
            if (hotelId != null && !hotelId.equals(principal.assignedHotelId()))
                throw new AccessDeniedException("Cannot access another hotel's rooms.");
            scope = principal.assignedHotelId();
        }
        if (!manager(principal) && scope == null) throw new AccessDeniedException("No hotel assigned.");
        List<PhysicalRoom> found = scope == null ? physicalRooms.findAll() : physicalRooms.findByHotelIdOrderByRoomNumberAsc(scope);
        return found.stream().map(this::response).toList();
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public PhysicalRoomResponse create(StaffPrincipal principal, PhysicalRoomRequest request) {
        Room type = lockedType(request.roomTypeId());
        authorize(principal, type.getHotelId());
        String number = request.roomNumber().trim();
        String key = key(number);
        if (physicalRooms.findByHotelIdAndRoomNumberKey(type.getHotelId(), key).isPresent())
            throw new ConflictException("Room number already exists in this hotel.");
        PhysicalRoom room = new PhysicalRoom();
        room.setHotelId(type.getHotelId());
        room.setRoomTypeId(type.getId());
        room.setRoomNumber(number);
        room.setRoomNumberKey(key);
        apply(room, request);
        if (physicalRooms.countByRoomTypeId(type.getId()) >= type.getInventoryCount()) {
            type.setInventoryCount(type.getInventoryCount() + 1);
            roomTypes.save(type);
        }
        if (!"AVAILABLE".equals(room.getBaseOperationalStatus()))
            ensureCapacity(type, type.getInventoryCount() - blockedCount(type) - 1, null);
        return response(physicalRooms.saveAndFlush(room));
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public List<PhysicalRoomResponse> createBatch(StaffPrincipal principal, List<PhysicalRoomRequest> requests) {
        if (requests == null || requests.isEmpty() || requests.size() > 100)
            throw new ConflictException("Provide between 1 and 100 physical rooms.");
        return requests.stream().map(request -> create(principal, request)).toList();
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public List<PhysicalRoomResponse> updateStatusBatch(StaffPrincipal principal, PhysicalRoomStatusBatchRequest request) {
        List<PhysicalRoomResponse> updated = new ArrayList<>();
        for (Long id : new LinkedHashSet<>(request.roomIds())) {
            PhysicalRoom room = require(id);
            updated.add(update(principal, id, new PhysicalRoomRequest(room.getRoomTypeId(), room.getRoomNumber(),
                    room.getFloor(), room.getWing(), request.status(), room.getCondition(), room.getNotes())));
        }
        return updated;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public PhysicalRoomResponse update(StaffPrincipal principal, Long id, PhysicalRoomRequest request) {
        PhysicalRoom room = require(id);
        Room type = lockedType(room.getRoomTypeId());
        authorize(principal, type.getHotelId());
        if (!type.getId().equals(request.roomTypeId())) throw new ConflictException("Moving a physical room to a different type is not supported.");
        String number = request.roomNumber().trim();
        String key = key(number);
        if (!room.getRoomNumberKey().equals(key)) {
            if (physicalRooms.findByHotelIdAndRoomNumberKey(type.getHotelId(), key).isPresent())
                throw new ConflictException("Room number already exists in this hotel.");
            if (assignments.existsByPhysicalRoomId(id)
                    || reservations.existsByAssignedPhysicalRoomId(id)
                    || reservations.existsByHotelIdAndAssignedRoomNumberIgnoreCase(type.getHotelId(), room.getRoomNumber()))
                throw new ConflictException("Room number cannot change because reservation history references it.");
        }
        String newStatus = request.baseOperationalStatus() == null ? "AVAILABLE" : request.baseOperationalStatus();
        if (!"AVAILABLE".equals(newStatus) && "AVAILABLE".equals(room.getBaseOperationalStatus())) {
            if (assignments.countActiveFutureAssignments(id, LocalDate.now()) > 0
                    || reservations.findByHotelId(type.getHotelId()).stream().anyMatch(reservation ->
                    reservation.getReservationStatus() == com.lankastay.backend.entity.ReservationStatus.CONFIRMED
                    && reservation.getCheckOut().isAfter(LocalDate.now())
                    && room.getRoomNumber().equalsIgnoreCase(reservation.getAssignedRoomNumber())))
                throw new ConflictException("A future confirmed reservation is assigned to this room.");
            ensureCapacity(type, type.getInventoryCount() - blockedCount(type) - 1, room.getId());
        }
        room.setRoomNumber(number);
        room.setRoomNumberKey(key);
        apply(room, request);
        return response(physicalRooms.saveAndFlush(room));
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void delete(StaffPrincipal principal, Long id) {
        PhysicalRoom room = require(id);
        Room type = lockedType(room.getRoomTypeId());
        authorize(principal, type.getHotelId());
        if (assignments.existsByPhysicalRoomId(id)
                || reservations.existsByAssignedPhysicalRoomId(id)
                || reservations.existsByHotelIdAndAssignedRoomNumberIgnoreCase(type.getHotelId(), room.getRoomNumber()))
            throw new ConflictException("Reservation history references this room. Deactivate it instead.");
        if (blocks.existsByPhysicalRoomId(id))
            throw new ConflictException("Remove this room's scheduled restrictions before deleting it.");
        int reduced = type.getInventoryCount() - 1;
        if (type.getInventoryCount() < physicalRooms.countByRoomTypeId(type.getId()))
            throw new ConflictException("Room type inventory is lower than its configured physical rooms.");
        ensureCapacity(type, reduced - blockedCount(type) + ("AVAILABLE".equals(room.getBaseOperationalStatus()) ? 0 : 1), null);
        physicalRooms.delete(room);
        physicalRooms.flush();
        type.setInventoryCount(reduced);
        if (reduced == 0) type.setStatus("INACTIVE");
        roomTypes.save(type);
    }

    private void apply(PhysicalRoom room, PhysicalRoomRequest request) {
        room.setFloor(trim(request.floor()));
        room.setWing(trim(request.wing()));
        room.setNotes(trim(request.notes()));
        room.setBaseOperationalStatus(request.baseOperationalStatus() == null ? "AVAILABLE" : request.baseOperationalStatus());
        room.setCondition(request.condition() == null ? "READY" : request.condition());
    }

    private void ensureCapacity(Room type, int capacity, Long newlyInactiveRoomId) {
        Set<LocalDate> nights = new HashSet<>();
        LocalDate today = LocalDate.now();
        for (Reservation reservation : items.findActiveFutureReservationsForRoom(type.getId(), today)) {
            for (LocalDate night = reservation.getCheckIn().isBefore(today) ? today : reservation.getCheckIn();
                 night.isBefore(reservation.getCheckOut()); night = night.plusDays(1)) nights.add(night);
        }
        for (LocalDate night : nights) {
            long blockedOnNight = blocks.countBlockedForNight(type.getId(), night);
            if (newlyInactiveRoomId != null && blocks.countOverlapping(newlyInactiveRoomId, night, night.plusDays(1)) > 0)
                blockedOnNight--;
            if (items.bookedQuantityForNight(type.getId(), night) > capacity - blockedOnNight)
                throw new ConflictException("Confirmed reservations exceed the remaining inventory. Keep this room and deactivate it after the stays.");
        }
    }

    private int blockedCount(Room type) {
        return Math.toIntExact(physicalRooms.countByRoomTypeIdAndBaseOperationalStatusNot(type.getId(), "AVAILABLE"));
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public PhysicalRoomBlockResponse addBlock(StaffPrincipal principal, Long roomId, PhysicalRoomBlockRequest request) {
        PhysicalRoom room = require(roomId);
        Room type = lockedType(room.getRoomTypeId());
        authorize(principal, type.getHotelId());
        if (request.fromDate().isBefore(LocalDate.now()) || request.throughDate().isBefore(request.fromDate()))
            throw new ConflictException("Restriction dates must be a valid future range.");
        if (blocks.countOverlapping(roomId, request.fromDate(), request.throughDate().plusDays(1)) > 0)
            throw new ConflictException("A restriction already overlaps this room and date range.");
        if (assignments.countRoomReservationsOverlapping(roomId, request.fromDate(), request.throughDate().plusDays(1)) > 0)
            throw new ConflictException("A confirmed reservation is assigned to this room during the restriction.");
        for (Reservation reservation : reservations.findByHotelId(type.getHotelId())) {
            if (reservation.getReservationStatus() == com.lankastay.backend.entity.ReservationStatus.CONFIRMED
                    && room.getRoomNumber().equalsIgnoreCase(reservation.getAssignedRoomNumber())
                    && reservation.getCheckIn().isBefore(request.throughDate().plusDays(1))
                    && reservation.getCheckOut().isAfter(request.fromDate()))
                throw new ConflictException("A confirmed reservation is assigned to this room during the restriction.");
        }
        if ("AVAILABLE".equals(room.getBaseOperationalStatus())) {
            for (LocalDate night = request.fromDate(); !night.isAfter(request.throughDate()); night = night.plusDays(1)) {
                int capacity = type.getInventoryCount() - blockedCount(type)
                        - Math.toIntExact(blocks.countBlockedForNight(type.getId(), night)) - 1;
                if (items.bookedQuantityForNight(type.getId(), night) > capacity)
                    throw new ConflictException("Confirmed reservations exceed capacity on " + night + ".");
            }
        }
        PhysicalRoomBlock block = new PhysicalRoomBlock();
        block.setPhysicalRoomId(roomId);
        block.setType(request.type());
        block.setReason(request.reason().trim());
        block.setFromDate(request.fromDate());
        block.setThroughDate(request.throughDate());
        block.setReturnState(request.returnState() == null ? "AVAILABLE" : request.returnState());
        return PhysicalRoomBlockResponse.from(blocks.saveAndFlush(block));
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public List<PhysicalRoomBlockResponse> addBlocks(StaffPrincipal principal, PhysicalRoomBlockBatchRequest request) {
        List<PhysicalRoomBlockResponse> added = new ArrayList<>();
        for (Long id : new LinkedHashSet<>(request.roomIds())) added.add(addBlock(principal, id, request.block()));
        return added;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void removeBlock(StaffPrincipal principal, Long roomId, Long blockId) {
        PhysicalRoom room = require(roomId);
        Room type = lockedType(room.getRoomTypeId());
        authorize(principal, type.getHotelId());
        PhysicalRoomBlock block = blocks.findById(blockId).orElseThrow(() -> new ResourceNotFoundException("Restriction not found."));
        if (!block.getPhysicalRoomId().equals(roomId)) throw new ResourceNotFoundException("Restriction not found for this room.");
        blocks.delete(block);
    }

    private PhysicalRoomResponse response(PhysicalRoom room) {
        return PhysicalRoomResponse.from(room, blocks.findByPhysicalRoomId(room.getId()).stream().map(PhysicalRoomBlockResponse::from).toList());
    }

    private PhysicalRoom require(Long id) { return physicalRooms.findById(id).orElseThrow(() -> new ResourceNotFoundException("Physical room not found.")); }
    private Room lockedType(Long id) { return roomTypes.findByIdForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Room type not found.")); }
    private void authorize(StaffPrincipal principal, Long hotelId) {
        if (!manager(principal) || (principal.assignedHotelId() != null && !principal.assignedHotelId().equals(hotelId)))
            throw new AccessDeniedException("Only a manager for this hotel can change physical rooms.");
    }
    private boolean manager(StaffPrincipal principal) { return "MANAGER".equalsIgnoreCase(principal.role()); }
    private String key(String number) { return number.toLowerCase(Locale.ROOT); }
    private String trim(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
