package com.lankastay.backend.service;

import com.lankastay.backend.dto.reservation.*;
import com.lankastay.backend.entity.*;
import com.lankastay.backend.exception.ApiException;
import com.lankastay.backend.exception.ConflictException;
import com.lankastay.backend.repository.ReservationItemRepository;
import com.lankastay.backend.repository.ReservationRepository;
import com.lankastay.backend.repository.RoomRepository;
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
    private final RoomRepository roomTypes;
    private final CustomerReservationService customerReservations;
    private final CustomerUserRepository customers;

    public ManagementReservationService(ReservationRepository reservations, ReservationItemRepository items, SecurityAuditService audit,
                                        RoomRepository roomTypes,
                                        CustomerReservationService customerReservations, CustomerUserRepository customers) {
        this.reservations = reservations;
        this.items = items;
        this.audit = audit;
        this.roomTypes = roomTypes;
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
            reservation.setAssignedRoomNumber(null);
            reservation.setAssignmentState(AssignmentState.UNASSIGNED);
            return response(reservations.saveAndFlush(reservation));
        }
        if (Boolean.TRUE.equals(request.remove())) {
            reservation.setAssignedRoomNumber(null);
            reservation.setAssignmentState(AssignmentState.UNASSIGNED);
            return response(reservations.saveAndFlush(reservation));
        }
        ReservationItem item = items.findByReservationId(id).stream().findFirst()
                .orElseThrow(() -> new ConflictException("Reservation has no room inventory item."));
        roomTypes.findByIdForUpdate(item.getRoomId())
                .orElseThrow(() -> new ConflictException("Room type no longer exists."));
        if (reservations.countOverlappingRoomAssignments(reservation.getHotelId(), number, id,
                reservation.getCheckIn(), reservation.getCheckOut()) > 0)
            throw new ConflictException("This room is already assigned to an overlapping confirmed reservation.");
        reservation.setAssignedRoomNumber(number);
        reservation.setAssignmentState(AssignmentState.ASSIGNED);
        audit.record(principal.id(), reservation.getCustomerId(), SecurityEventType.RESERVATION_ROOM_ASSIGNED, null, "SUCCESS");
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
        return ReservationResponse.from(reservation,
                items.findByReservationId(reservation.getId()).stream().map(ReservationItemResponse::from).toList());
    }
    private List<ReservationResponse> map(List<Reservation> found) {
        if (found.isEmpty()) return List.of();
        Map<Long, List<ReservationItemResponse>> grouped = new HashMap<>();
        items.findByReservationIdIn(found.stream().map(Reservation::getId).toList()).forEach(item ->
                grouped.computeIfAbsent(item.getReservationId(), ignored -> new ArrayList<>()).add(ReservationItemResponse.from(item)));
        return found.stream().map(r -> ReservationResponse.from(r, grouped.getOrDefault(r.getId(), List.of()))).toList();
    }
}
