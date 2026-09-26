package com.lankastay.backend.service;

import com.lankastay.backend.dto.reservation.*;
import com.lankastay.backend.entity.*;
import com.lankastay.backend.exception.ApiException;
import com.lankastay.backend.exception.ConflictException;
import com.lankastay.backend.repository.ReservationItemRepository;
import com.lankastay.backend.repository.ReservationRepository;
import com.lankastay.backend.repository.PhysicalRoomRepository;
import com.lankastay.backend.repository.PhysicalRoomBlockRepository;
import com.lankastay.backend.repository.RoomRepository;
import com.lankastay.backend.repository.ReservationPhysicalRoomRepository;
import com.lankastay.backend.repository.CustomerUserRepository;
import com.lankastay.backend.security.StaffPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ManagementReservationService {
    private final ReservationRepository reservations;
    private final ReservationItemRepository items;
    private final SecurityAuditService audit;
    private final PhysicalRoomRepository physicalRooms;
    private final PhysicalRoomBlockRepository physicalBlocks;
    private final RoomRepository roomTypes;
    private final ReservationPhysicalRoomRepository assignments;
    private final CustomerReservationService customerReservations;
    private final CustomerUserRepository customers;

    public ManagementReservationService(ReservationRepository reservations, ReservationItemRepository items, SecurityAuditService audit,
                                        PhysicalRoomRepository physicalRooms, PhysicalRoomBlockRepository physicalBlocks,
                                        RoomRepository roomTypes, ReservationPhysicalRoomRepository assignments,
                                        CustomerReservationService customerReservations, CustomerUserRepository customers) {
        this.reservations = reservations;
        this.items = items;
        this.audit = audit;
        this.physicalRooms = physicalRooms;
        this.physicalBlocks = physicalBlocks;
        this.roomTypes = roomTypes;
        this.assignments = assignments;
        this.customerReservations = customerReservations;
        this.customers = customers;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ReservationResponse create(StaffPrincipal principal, CreateReservationRequest request) {
        scopedHotel(principal, request.hotelId());
        CustomerUser customer = customers.findByEmail(CustomerUser.normalizeEmail(request.guestEmail()))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Customer Required",
                        "A registered customer account with this email is required for a reception reservation."));
        return customerReservations.create(customer.getId(), request);
    }

    @Transactional(readOnly = true)
    public ReservationQuoteResponse quote(StaffPrincipal principal, ReservationQuoteRequest request) {
        scopedHotel(principal, request.hotelId());
        return customerReservations.quote(request);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> list(StaffPrincipal principal, Long requestedHotelId) {
        Long hotelId = scopedHotel(principal, requestedHotelId);
        List<Reservation> found = hotelId == null
                ? reservations.findAllByOrderByCreatedAtDesc()
                : reservations.findByHotelIdOrderByCreatedAtDesc(hotelId);
        return map(found);
    }

    @Transactional(readOnly = true)
    public ReservationResponse get(StaffPrincipal principal, Long id) { return response(requireScoped(principal, id)); }

    @Transactional(readOnly = true)
    public List<ReservationItemResponse> getItems(StaffPrincipal principal, Long id) {
        requireScoped(principal, id);
        return items.findByReservationId(id).stream().map(ReservationItemResponse::from).toList();
    }

    @Transactional
    public ReservationResponse updateStatus(StaffPrincipal principal, Long id, ReservationStatusRequest request) {
        Reservation reservation = requireScoped(principal, id);
        if (request.reservationStatus() != null && request.reservationStatus() != reservation.getReservationStatus()) {
            if (reservation.getReservationStatus() != ReservationStatus.CONFIRMED
                    || (request.reservationStatus() != ReservationStatus.COMPLETED && request.reservationStatus() != ReservationStatus.CANCELLED)) {
                throw new ConflictException("That reservation status transition is not allowed.");
            }
            if (request.reservationStatus() == ReservationStatus.COMPLETED && reservation.getCheckOut().isAfter(java.time.LocalDate.now()))
                throw new ConflictException("A reservation cannot be completed before checkout.");
            reservation.setReservationStatus(request.reservationStatus());
            if (request.reservationStatus() == ReservationStatus.CANCELLED) {
                reservation.setCancelledAt(LocalDateTime.now());
                reservation.setCancellationReason("Cancelled by hotel staff");
                reservation.setCancelledByType("STAFF");
            }
            audit.record(principal.id(), reservation.getCustomerId(), request.reservationStatus() == ReservationStatus.COMPLETED
                    ? SecurityEventType.RESERVATION_COMPLETED : SecurityEventType.RESERVATION_CANCELLED, null, "SUCCESS");
        }
        if (request.paymentStatus() != null) reservation.setPaymentStatus(request.paymentStatus());
        return response(reservations.save(reservation));
    }

    @Transactional
    public ReservationResponse cancel(StaffPrincipal principal, Long id, CancellationRequest request) {
        Reservation reservation = requireScoped(principal, id);
        if (reservation.getReservationStatus() != ReservationStatus.CONFIRMED) {
            throw new ConflictException("Reservation cannot be cancelled in its current status.");
        }
        reservation.setReservationStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(LocalDateTime.now());
        reservation.setCancellationReason(request.reason().trim());
        reservation.setCancellationNote(request.note() == null || request.note().isBlank() ? null : request.note().trim());
        reservation.setCancelledByType("STAFF");
        audit.record(principal.id(), reservation.getCustomerId(), SecurityEventType.RESERVATION_CANCELLED, null, "SUCCESS");
        return response(reservations.save(reservation));
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ReservationResponse assignRoom(StaffPrincipal principal, Long id, RoomAssignmentRequest request) {
        Reservation reservation = requireScopedForUpdate(principal, id);
        if (reservation.getReservationStatus() != ReservationStatus.CONFIRMED) {
            throw new ConflictException("Only confirmed reservations can receive a room assignment.");
        }
        String number = request.roomNumber() == null || request.roomNumber().isBlank() ? null : request.roomNumber().trim();
        if (number == null) {
            assignments.deleteByReservationId(id);
            assignments.flush();
            reservation.setAssignedRoomNumber(null);
            reservation.setAssignedPhysicalRoomId(null);
            reservation.setAssignmentState(AssignmentState.UNASSIGNED);
            return response(reservations.saveAndFlush(reservation));
        }
        boolean removing = Boolean.TRUE.equals(request.remove());
        if (number != null) {
            PhysicalRoom selected = physicalRooms.findByHotelIdAndRoomNumberKey(reservation.getHotelId(), number.toLowerCase(Locale.ROOT))
                    .orElseThrow(() -> new ConflictException("Room number does not exist in this hotel."));
            roomTypes.findByIdForUpdate(selected.getRoomTypeId()).orElseThrow(() -> new ConflictException("Room type no longer exists."));
            PhysicalRoom physical = physicalRooms.findByIdForUpdate(selected.getId()).orElseThrow();
            var current = assignments.findByReservationIdOrderByIdAsc(id);
            if (removing) {
                current.stream().filter(a -> a.getPhysicalRoomId().equals(physical.getId()))
                        .findFirst().ifPresent(assignments::delete);
                assignments.flush();
            } else if (current.stream().noneMatch(a -> a.getPhysicalRoomId().equals(physical.getId()))) {
                if (!"AVAILABLE".equals(physical.getBaseOperationalStatus()))
                    throw new ConflictException("This physical room is not available for assignment.");
                if (physicalBlocks.countOverlapping(physical.getId(), reservation.getCheckIn(), reservation.getCheckOut()) > 0)
                    throw new ConflictException("A scheduled restriction overlaps this reservation.");
                boolean matchingType = items.findByReservationId(id).stream().anyMatch(item -> item.getRoomId().equals(physical.getRoomTypeId()));
                if (!matchingType) throw new ConflictException("Physical room type does not match the reservation.");
                int quantity = items.findByReservationId(id).stream().mapToInt(ReservationItem::getQuantity).sum();
                if (current.size() >= quantity) throw new ConflictException("All reserved room units are already assigned.");
                if (assignments.countOverlapping(physical.getId(), id, reservation.getCheckIn(), reservation.getCheckOut()) > 0
                        || reservations.countOverlappingRoomAssignments(reservation.getHotelId(), number, id, reservation.getCheckIn(), reservation.getCheckOut()) > 0)
                    throw new ConflictException("This room is already assigned to an overlapping confirmed reservation.");
                ReservationPhysicalRoom added = new ReservationPhysicalRoom();
                added.setReservationId(id);
                added.setPhysicalRoomId(physical.getId());
                assignments.saveAndFlush(added);
                audit.record(principal.id(), reservation.getCustomerId(), SecurityEventType.RESERVATION_ROOM_ASSIGNED, null, "SUCCESS");
            }
        }
        var current = assignments.findByReservationIdOrderByIdAsc(id);
        PhysicalRoom first = current.isEmpty() ? null : physicalRooms.findById(current.get(0).getPhysicalRoomId()).orElse(null);
        reservation.setAssignedRoomNumber(first == null ? null : first.getRoomNumber());
        reservation.setAssignedPhysicalRoomId(first == null ? null : first.getId());
        int quantity = items.findByReservationId(id).stream().mapToInt(ReservationItem::getQuantity).sum();
        reservation.setAssignmentState(current.isEmpty() ? AssignmentState.UNASSIGNED
                : current.size() < quantity ? AssignmentState.PARTIALLY_ASSIGNED : AssignmentState.ASSIGNED);
        return response(reservations.saveAndFlush(reservation));
    }

    private Reservation requireScopedForUpdate(StaffPrincipal principal, Long id) {
        Reservation reservation = reservations.findByIdForUpdate(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Reservation not found."));
        if ((!isManager(principal) && principal.assignedHotelId() == null)
                || (principal.assignedHotelId() != null && !Objects.equals(principal.assignedHotelId(), reservation.getHotelId())))
            throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "Access to this hotel's reservation is denied.");
        return reservation;
    }

    private Reservation requireScoped(StaffPrincipal principal, Long id) {
        Reservation reservation = reservations.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Reservation not found."));
        if ((!isManager(principal) && principal.assignedHotelId() == null)
                || (principal.assignedHotelId() != null && !Objects.equals(principal.assignedHotelId(), reservation.getHotelId()))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "Access to this hotel's reservation is denied.");
        }
        return reservation;
    }

    private Long scopedHotel(StaffPrincipal principal, Long requested) {
        if (isManager(principal)) {
            if (principal.assignedHotelId() != null && requested != null && !principal.assignedHotelId().equals(requested))
                throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "Access to this hotel's reservations is denied.");
            return principal.assignedHotelId() != null ? principal.assignedHotelId() : requested;
        }
        if (principal.assignedHotelId() == null) throw new ApiException(HttpStatus.FORBIDDEN, "Forbidden", "No hotel is assigned to this staff account.");
        return principal.assignedHotelId();
    }

    private boolean isManager(StaffPrincipal principal) { return "MANAGER".equalsIgnoreCase(principal.role()); }
    private ReservationResponse response(Reservation reservation) {
        return ReservationResponse.from(reservation, items.findByReservationId(reservation.getId()).stream().map(ReservationItemResponse::from).toList(),
                assignments.findByReservationIdOrderByIdAsc(reservation.getId()).stream().map(ReservationPhysicalRoom::getPhysicalRoomId).toList());
    }
    private List<ReservationResponse> map(List<Reservation> found) {
        if (found.isEmpty()) return List.of();
        Map<Long, List<ReservationItemResponse>> grouped = new HashMap<>();
        items.findByReservationIdIn(found.stream().map(Reservation::getId).toList()).forEach(item ->
                grouped.computeIfAbsent(item.getReservationId(), ignored -> new ArrayList<>()).add(ReservationItemResponse.from(item)));
        return found.stream().map(r -> ReservationResponse.from(r, grouped.getOrDefault(r.getId(), List.of()),
                assignments.findByReservationIdOrderByIdAsc(r.getId()).stream().map(ReservationPhysicalRoom::getPhysicalRoomId).toList())).toList();
    }
}
