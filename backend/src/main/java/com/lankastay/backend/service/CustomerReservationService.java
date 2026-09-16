package com.lankastay.backend.service;

import com.lankastay.backend.dto.reservation.*;
import com.lankastay.backend.entity.*;
import com.lankastay.backend.exception.ApiException;
import com.lankastay.backend.exception.ConflictException;
import com.lankastay.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class CustomerReservationService {
    private static final String AVAILABILITY_MESSAGE = "The selected room is no longer available for the full requested stay.";
    private final ReservationRepository reservations;
    private final ReservationItemRepository items;
    private final HotelRepository hotels;
    private final RoomRepository rooms;
    private final RoomRateRepository rates;
    private final OfferRepository offers;
    private final SecurityAuditService audit;
    private final PhysicalRoomRepository physicalRooms;
    private final PhysicalRoomBlockRepository physicalBlocks;
    private final ReservationPhysicalRoomRepository assignments;
    private final ReviewRepository reviews;

    public CustomerReservationService(ReservationRepository reservations, ReservationItemRepository items,
            HotelRepository hotels, RoomRepository rooms, RoomRateRepository rates,
            OfferRepository offers, SecurityAuditService audit, PhysicalRoomRepository physicalRooms,
            PhysicalRoomBlockRepository physicalBlocks, ReservationPhysicalRoomRepository assignments,
            ReviewRepository reviews) {
        this.reservations = reservations;
        this.items = items;
        this.hotels = hotels;
        this.rooms = rooms;
        this.rates = rates;
        this.offers = offers;
        this.audit = audit;
        this.physicalRooms = physicalRooms;
        this.physicalBlocks = physicalBlocks;
        this.assignments = assignments;
        this.reviews = reviews;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ReservationResponse create(UUID customerId, CreateReservationRequest request) {
        validateDatesAndGuests(request);
        Hotel hotel = hotels.findById(request.hotelId())
                .orElseThrow(() -> badRequest("The selected hotel does not exist."));
        if (!HotelStatus.PUBLICATION_ACTIVE.equalsIgnoreCase(hotel.getStatus())
                || !HotelStatus.PUBLICATION_ACTIVE.equalsIgnoreCase(hotel.getPublicationStatus())) {
            throw badRequest("The selected hotel is not available for booking.");
        }

        // This row lock is held until the reservation and item commit. Every booking
        // for this room type follows the same lock path, closing the check/insert race.

        Room room = rooms.findByIdForUpdate(request.roomId())
                .orElseThrow(() -> badRequest("The selected room does not exist."));
        validateRoom(request, room);

        RoomRate rate = rates.findById(request.rateId())
                .orElseThrow(() -> badRequest("The selected rate does not exist."));
        validateRate(request, rate);
        assertAvailable(room, request.checkIn(), request.checkOut(), request.quantity());

        long nights = ChronoUnit.DAYS.between(request.checkIn(), request.checkOut());
        BigDecimal subtotal = calculateTotal(rate, request.checkIn(), request.checkOut(), request.quantity());
        BigDecimal averageNightly = subtotal.divide(BigDecimal.valueOf(nights * request.quantity()), 2,
                RoundingMode.HALF_UP);

        // Backend-authoritative offer evaluation
        BigDecimal discountAmount = BigDecimal.ZERO;
        Offer appliedOffer = null;
        if (request.offerId() != null) {
            Offer candidate = offers.findById(request.offerId())
                    .orElseThrow(() -> badRequest("The selected offer does not exist."));
            EvaluatedOffer evaluated = evaluateOffer(candidate, subtotal, nights, request.quantity(), hotel.getId(),
                    room,
                    request.checkIn(), request.checkOut(), LocalDate.now());
            if (evaluated == null) {
                throw new ConflictException(
                        "The requested offer is no longer valid or eligible for your stay. Please review the updated quote.");
            }
            discountAmount = evaluated.discountAmount();
            appliedOffer = evaluated.offer();
        }

        BigDecimal finalTotal = subtotal.subtract(discountAmount).setScale(2, RoundingMode.HALF_UP);
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0)
            finalTotal = BigDecimal.ZERO;

        Reservation reservation = new Reservation();
        reservation.setReservationCode(generateReference());
        reservation.setHotelId(hotel.getId());
        reservation.setCustomerId(customerId);
        reservation.setGuestName((request.guestFirstName().trim() + " " + request.guestLastName().trim()).trim());
        reservation.setGuestEmail(CustomerUser.normalizeEmail(request.guestEmail()));
        reservation.setGuestPhone(trimToNull(request.guestPhone()));
        reservation.setCheckIn(request.checkIn());
        reservation.setCheckOut(request.checkOut());
        reservation.setNumberOfNights(Math.toIntExact(nights));
        reservation.setAdults(request.adults());
        reservation.setChildren(request.children());
        reservation.setSubtotalAmount(subtotal);
        reservation.setDiscountAmount(discountAmount);
        reservation.setNetAmount(finalTotal);
        reservation.setTaxAmount(BigDecimal.ZERO);
        reservation.setTotalAmount(finalTotal);
        reservation.setPaymentStatus(PaymentStatus.PENDING);
        reservation.setReservationStatus(ReservationStatus.CONFIRMED);
        reservation.setAssignmentState(AssignmentState.UNASSIGNED);
        reservation.setSpecialRequests(trimToNull(request.specialRequests()));
        reservation.setEstimatedArrivalTime(trimToNull(request.estimatedArrivalTime()));

        if (appliedOffer != null) {
            reservation.setAppliedOfferId(appliedOffer.getId());
            reservation.setOfferTitleSnapshot(appliedOffer.getTitle());
            reservation.setDiscountTypeSnapshot(appliedOffer.getDiscountType());
            reservation.setDiscountValueSnapshot(appliedOffer.getDiscountValue());
        }

        Reservation saved = reservations.saveAndFlush(reservation);

        ReservationItem item = new ReservationItem();
        item.setReservationId(saved.getId());
        item.setRoomId(room.getId());
        item.setRoomRateId(rate.getId());
        item.setQuantity(request.quantity());
        item.setNightlyRate(averageNightly);
        item.setTotalPrice(subtotal);
        item.setRoomNameSnapshot(room.getName());
        ReservationItem savedItem = items.save(item);
        audit.record(customerId, customerId, SecurityEventType.RESERVATION_CREATED, null, "SUCCESS");
        return ReservationResponse.from(saved, List.of(ReservationItemResponse.from(savedItem)));
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> list(UUID customerId) {
        return map(reservations.findByCustomerIdOrderByCreatedAtDesc(customerId));
    }

    @Transactional(readOnly = true)
    public ReservationResponse get(UUID customerId, Long id) {
        Reservation reservation = reservations.findByIdAndCustomerId(id, customerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Reservation not found."));
        return response(reservation);
    }

    @Transactional
    public ReservationResponse cancel(UUID customerId, Long id, CancellationRequest request) {
        Reservation reservation = reservations.findByIdAndCustomerId(id, customerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Reservation not found."));
        cancelReservation(reservation, request, "CUSTOMER");
        audit.record(customerId, customerId, SecurityEventType.RESERVATION_CANCELLED, null, "SUCCESS");
        return response(reservation);
    }

    @Transactional
    public void delete(UUID customerId, Long id) {
        Reservation reservation = reservations.findByIdAndCustomerIdForUpdate(id, customerId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "Reservation not found."));
        if (reservation.getReservationStatus() != ReservationStatus.CANCELLED) {
            throw new ConflictException("Only cancelled reservations can be permanently deleted.");
        }
        if (reservation.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new ConflictException(
                    "Reservations with paid or partially paid transactions cannot be permanently deleted.");
        }
        if (reviews.existsByReservationId(id)) {
            throw new ConflictException("A reservation linked to a review cannot be permanently deleted.");
        }
        try {
            assignments.deleteByReservationId(id);
            items.deleteByReservationId(id);
            reservations.delete(reservation);
            reservations.flush();
        } catch (DataIntegrityViolationException conflict) {
            throw new ConflictException(
                    "This reservation cannot be permanently deleted because dependent records must be preserved.");
        }
        audit.record(customerId, customerId, SecurityEventType.RESERVATION_DELETED, null, "SUCCESS");
    }

    @Transactional(readOnly = true)
    public AvailabilityResponse availability(Long hotelId, Long roomId, LocalDate checkIn, LocalDate checkOut,
            int quantity) {
        if (hotelId == null || roomId == null || checkIn == null || checkOut == null || !checkIn.isBefore(checkOut)
                || quantity < 1) {
            throw badRequest("Valid hotel, room, dates and quantity are required.");
        }
        Room room = rooms.findById(roomId).orElseThrow(() -> badRequest("The selected room does not exist."));
        if (!Objects.equals(room.getHotelId(), hotelId) || !"ACTIVE".equalsIgnoreCase(room.getStatus())) {
            throw badRequest("The selected room is not bookable at this hotel.");
        }
        int minimum = room.getInventoryCount();
        LocalDate unavailable = null;
        for (LocalDate night = checkIn; night.isBefore(checkOut); night = night.plusDays(1)) {
            int available = effectiveCapacity(room, night)
                    - Math.toIntExact(items.bookedQuantityForNight(roomId, night));
            minimum = Math.min(minimum, available);
            if (available < quantity && unavailable == null)
                unavailable = night;
        }
        boolean available = unavailable == null;
        return new AvailabilityResponse(available, Math.max(0, minimum), unavailable,
                available ? "Room type is available." : AVAILABILITY_MESSAGE);
    }

    @Transactional(readOnly = true)
    public ReservationQuoteResponse quote(ReservationQuoteRequest request) {
        if (!request.checkIn().isBefore(request.checkOut()) || request.checkIn().isBefore(LocalDate.now())) {
            throw badRequest("Check-out must be after check-in and check-in cannot be in the past.");
        }
        Hotel hotel = hotels.findById(request.hotelId())
                .orElseThrow(() -> badRequest("The selected hotel does not exist."));
        if (!HotelStatus.PUBLICATION_ACTIVE.equalsIgnoreCase(hotel.getStatus())
                || !HotelStatus.PUBLICATION_ACTIVE.equalsIgnoreCase(hotel.getPublicationStatus())) {
            throw badRequest("The selected hotel is not available for booking.");
        }
        Room room = rooms.findById(request.roomId()).orElseThrow(() -> badRequest("The selected room does not exist."));
        CreateReservationRequest validation = new CreateReservationRequest(request.hotelId(), request.roomId(),
                request.rateId(),
                request.checkIn(), request.checkOut(), request.adults(), request.children(), request.quantity(),
                "Quote", "Guest", "quote@example.com", null, null, null);
        validateRoom(validation, room);
        RoomRate rate = rates.findById(request.rateId())
                .orElseThrow(() -> badRequest("The selected rate does not exist."));
        validateRate(validation, rate);
        AvailabilityResponse availability = availability(request.hotelId(), request.roomId(), request.checkIn(),
                request.checkOut(), request.quantity());
        List<ReservationQuoteResponse.NightlyPrice> nightly = new ArrayList<>();
        for (LocalDate date = request.checkIn(); date.isBefore(request.checkOut()); date = date.plusDays(1)) {
            boolean weekend = date.getDayOfWeek() == DayOfWeek.FRIDAY || date.getDayOfWeek() == DayOfWeek.SATURDAY;
            BigDecimal amount = weekend && rate.getWeekendNightlyRate() != null
                    && rate.getWeekendNightlyRate().compareTo(BigDecimal.ZERO) > 0
                            ? rate.getWeekendNightlyRate()
                            : rate.getBaseNightlyRate();
            nightly.add(new ReservationQuoteResponse.NightlyPrice(date, amount.setScale(2, RoundingMode.HALF_UP)));
        }
        BigDecimal subtotal = calculateTotal(rate, request.checkIn(), request.checkOut(), request.quantity());
        long nights = ChronoUnit.DAYS.between(request.checkIn(), request.checkOut());

        // Offer quote calculation
        BigDecimal discountAmount = BigDecimal.ZERO;
        ReservationQuoteResponse.AppliedOfferDto appliedOfferDto = null;

        if (request.offerId() != null) {
            Offer candidate = offers.findById(request.offerId())
                    .orElseThrow(() -> badRequest("The selected offer does not exist."));
            EvaluatedOffer evaluated = evaluateOffer(candidate, subtotal, nights, request.quantity(), hotel.getId(),
                    room,
                    request.checkIn(), request.checkOut(), LocalDate.now());
            if (evaluated != null) {
                discountAmount = evaluated.discountAmount();
                appliedOfferDto = new ReservationQuoteResponse.AppliedOfferDto(
                        candidate.getId(), candidate.getTitle(), candidate.getDiscountType(),
                        candidate.getDiscountValue(), candidate.getFixedDiscountScope(), discountAmount);
            }
        } else {
            EvaluatedOffer best = findBestOffer(subtotal, nights, request.quantity(), hotel.getId(), room,
                    request.checkIn(), request.checkOut(), LocalDate.now());
            if (best != null) {
                discountAmount = best.discountAmount();
                appliedOfferDto = new ReservationQuoteResponse.AppliedOfferDto(
                        best.offer().getId(), best.offer().getTitle(), best.offer().getDiscountType(),
                        best.offer().getDiscountValue(), best.offer().getFixedDiscountScope(), discountAmount);
            }
        }

        BigDecimal finalTotal = subtotal.subtract(discountAmount).setScale(2, RoundingMode.HALF_UP);
        if (finalTotal.compareTo(BigDecimal.ZERO) < 0)
            finalTotal = BigDecimal.ZERO;

        return new ReservationQuoteResponse(availability.available(), availability.availableQuantity(), nightly.size(),
                nightly,
                subtotal, discountAmount, finalTotal, appliedOfferDto, availability.message());
    }

    void cancelReservation(Reservation reservation, CancellationRequest request, String actorType) {
        if (reservation.getReservationStatus() != ReservationStatus.CONFIRMED) {
            throw new ConflictException("Reservation cannot be cancelled in its current status.");
        }
        if (!reservation.getCheckIn().isAfter(LocalDate.now())) {
            throw new ConflictException("Only upcoming reservations can be cancelled.");
        }
        reservation.setReservationStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(LocalDateTime.now());
        reservation.setCancellationReason(request.reason().trim());
        reservation.setCancellationNote(trimToNull(request.note()));
        reservation.setCancelledByType(actorType);
        reservations.save(reservation);
    }

    private void validateDatesAndGuests(CreateReservationRequest request) {
        if (!request.checkIn().isBefore(request.checkOut()))
            throw badRequest("Check-out must be after check-in.");
        if (request.checkIn().isBefore(LocalDate.now()))
            throw badRequest("Check-in cannot be in the past.");
    }

    private void validateRoom(CreateReservationRequest request, Room room) {
        if (!Objects.equals(room.getHotelId(), request.hotelId()))
            throw badRequest("The selected room does not belong to this hotel.");
        if (!"ACTIVE".equalsIgnoreCase(room.getStatus()) || room.getInventoryCount() == null
                || room.getInventoryCount() < 1) {
            throw badRequest("The selected room is not available for booking.");
        }
        if (request.quantity() > room.getInventoryCount())
            throw new ConflictException(AVAILABILITY_MESSAGE);
        int adultsCapacity = room.getMaxAdults() * request.quantity();
        int childrenCapacity = room.getMaxChildren() * request.quantity();
        int totalCapacity = room.getMaxOccupancy() * request.quantity();
        if (request.adults() > adultsCapacity || request.children() > childrenCapacity
                || request.adults() + request.children() > totalCapacity) {
            throw badRequest("Guest count exceeds the selected room capacity.");
        }
    }

    private void validateRate(CreateReservationRequest request, RoomRate rate) {
        if (!Objects.equals(rate.getHotelId(), request.hotelId())
                || !Objects.equals(rate.getRoomId(), request.roomId())) {
            throw badRequest("The selected rate does not belong to this hotel and room.");
        }
        if (!"ACTIVE".equalsIgnoreCase(rate.getStatus()) || rate.getBaseNightlyRate() == null
                || rate.getBaseNightlyRate().compareTo(BigDecimal.ZERO) <= 0) {
            throw badRequest("The selected rate is not active.");
        }
    }

    private void assertAvailable(Room room, LocalDate checkIn, LocalDate checkOut, int requested) {
        for (LocalDate night = checkIn; night.isBefore(checkOut); night = night.plusDays(1)) {
            long booked = items.bookedQuantityForNight(room.getId(), night);
            if (effectiveCapacity(room, night) - booked < requested)
                throw new ConflictException(AVAILABILITY_MESSAGE);
        }
    }

    private int effectiveCapacity(Room room, LocalDate night) {
        return Math.max(0, room.getInventoryCount() - Math.toIntExact(
                physicalRooms.countByRoomTypeIdAndBaseOperationalStatusNot(room.getId(), "AVAILABLE"))
                - Math.toIntExact(physicalBlocks.countBlockedForNight(room.getId(), night)));
    }

    private BigDecimal calculateTotal(RoomRate rate, LocalDate checkIn, LocalDate checkOut, int quantity) {
        BigDecimal total = BigDecimal.ZERO;
        for (LocalDate night = checkIn; night.isBefore(checkOut); night = night.plusDays(1)) {
            boolean weekend = night.getDayOfWeek() == DayOfWeek.FRIDAY || night.getDayOfWeek() == DayOfWeek.SATURDAY;
            BigDecimal amount = weekend && rate.getWeekendNightlyRate() != null
                    && rate.getWeekendNightlyRate().compareTo(BigDecimal.ZERO) > 0
                            ? rate.getWeekendNightlyRate()
                            : rate.getBaseNightlyRate();
            total = total.add(amount.multiply(BigDecimal.valueOf(quantity)));
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private record EvaluatedOffer(Offer offer, BigDecimal discountAmount) {
    }

    private EvaluatedOffer evaluateOffer(Offer offer, BigDecimal subtotal, long nights, int quantity,
            Long hotelId, Room room, LocalDate checkIn, LocalDate checkOut,
            LocalDate bookingDate) {
        if (offer == null || !"ACTIVE".equalsIgnoreCase(offer.getStatus())) {
            return null;
        }

        // Booking date window check
        if (offer.getBookingStartDate() != null && bookingDate.isBefore(offer.getBookingStartDate())) {
            return null;
        }
        if (offer.getBookingEndDate() != null && bookingDate.isAfter(offer.getBookingEndDate())) {
            return null;
        }

        // Stay date window check
        if (checkIn.isBefore(offer.getStayStartDate()) || checkOut.minusDays(1).isAfter(offer.getStayEndDate())) {
            return null;
        }

        // Minimum and maximum stay
        if (nights < offer.getMinimumStay()) {
            return null;
        }
        if (offer.getMaximumStay() != null && nights > offer.getMaximumStay()) {
            return null;
        }

        // Targeting is the union displayed by Offer Management: an entire
        // hotel, a room category, or one specific room type may make a room
        // eligible.  It must not silently become an AND constraint at quote
        // time, and category targets must be honoured by the backend too.
        boolean hasHotelTargets = !offer.getTargetHotelIds().isEmpty();
        boolean hasRoomTargets = !offer.getTargetRoomTypeIds().isEmpty();
        Set<String> categoryTargets = offer.getTargetRoomCategoryKeys() == null || offer.getTargetRoomCategoryKeys().isBlank()
                ? Set.of()
                : Arrays.stream(offer.getTargetRoomCategoryKeys().split(","))
                .map(String::trim).filter(value -> !value.isBlank()).collect(java.util.stream.Collectors.toSet());
        boolean hasCategoryTargets = !categoryTargets.isEmpty();
        if (hasHotelTargets || hasRoomTargets || hasCategoryTargets) {
            boolean matchesTarget = offer.getTargetHotelIds().contains(hotelId)
                    || offer.getTargetRoomTypeIds().contains(room.getId())
                    || categoryTargets.contains(room.getRoomCategory());
            if (!matchesTarget) return null;
        }

        // Applicable days check
        if (offer.getApplicableDays() != null && !offer.getApplicableDays().isBlank()) {
            Set<String> days = new HashSet<>(Arrays.asList(offer.getApplicableDays().toUpperCase().split(",")));
            if (days.size() < 7) {
                for (LocalDate date = checkIn; date.isBefore(checkOut); date = date.plusDays(1)) {
                    String dayName = switch (date.getDayOfWeek()) {
                        case MONDAY -> "MON";
                        case TUESDAY -> "TUE";
                        case WEDNESDAY -> "WED";
                        case THURSDAY -> "THU";
                        case FRIDAY -> "FRI";
                        case SATURDAY -> "SAT";
                        case SUNDAY -> "SUN";
                    };
                    if (!days.contains(dayName)) {
                        return null;
                    }
                }
            }
        }

        // Calculate discount amount
        BigDecimal discount = BigDecimal.ZERO;
        if ("PERCENTAGE".equalsIgnoreCase(offer.getDiscountType())) {
            discount = subtotal.multiply(offer.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else if ("FIXED_AMOUNT".equalsIgnoreCase(offer.getDiscountType())) {
            if ("PER_NIGHT".equalsIgnoreCase(offer.getFixedDiscountScope())) {
                discount = offer.getDiscountValue().multiply(BigDecimal.valueOf(nights * quantity));
            } else {
                discount = offer.getDiscountValue();
            }
        }

        if (discount.compareTo(subtotal) > 0)
            discount = subtotal;
        if (discount.compareTo(BigDecimal.ZERO) < 0)
            discount = BigDecimal.ZERO;

        return new EvaluatedOffer(offer, discount.setScale(2, RoundingMode.HALF_UP));
    }

    private EvaluatedOffer findBestOffer(BigDecimal subtotal, long nights, int quantity,
            Long hotelId, Room room, LocalDate checkIn, LocalDate checkOut,
            LocalDate bookingDate) {
        List<Offer> activeOffers = offers.findByStatusOrderByDisplayOrderAscCreatedAtDesc("ACTIVE");
        EvaluatedOffer best = null;
        for (Offer offer : activeOffers) {
            EvaluatedOffer evaluated = evaluateOffer(offer, subtotal, nights, quantity, hotelId, room, checkIn,
                    checkOut, bookingDate);
            if (evaluated != null && evaluated.discountAmount().compareTo(BigDecimal.ZERO) > 0) {
                if (best == null || evaluated.discountAmount().compareTo(best.discountAmount()) > 0
                        || (evaluated.discountAmount().compareTo(best.discountAmount()) == 0
                                && evaluated.offer().getId() < best.offer().getId())) {
                    best = evaluated;
                }
            }
        }
        return best;
    }

    private String generateReference() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String candidate = "LS-" + LocalDate.now().getYear() + "-"
                    + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
            if (!reservations.existsByReservationCode(candidate))
                return candidate;
        }
        throw new ConflictException("A unique reservation reference could not be allocated. Please try again.");
    }

    private List<ReservationResponse> map(List<Reservation> found) {
        if (found.isEmpty())
            return List.of();
        Map<Long, List<ReservationItemResponse>> byReservation = new HashMap<>();
        items.findByReservationIdIn(found.stream().map(Reservation::getId).toList())
                .forEach(item -> byReservation.computeIfAbsent(item.getReservationId(), ignored -> new ArrayList<>())
                        .add(ReservationItemResponse.from(item)));
        return found.stream().map(r -> ReservationResponse.from(r, byReservation.getOrDefault(r.getId(), List.of()),
                assignments.findByReservationIdOrderByIdAsc(r.getId()).stream()
                        .map(ReservationPhysicalRoom::getPhysicalRoomId).toList()))
                .toList();
    }

    private ReservationResponse response(Reservation reservation) {
        return ReservationResponse.from(reservation,
                items.findByReservationId(reservation.getId()).stream().map(ReservationItemResponse::from).toList(),
                assignments.findByReservationIdOrderByIdAsc(reservation.getId()).stream()
                        .map(ReservationPhysicalRoom::getPhysicalRoomId).toList());
    }

    private ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, "Bad Request", message);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
