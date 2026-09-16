package com.lankastay.backend.dto.reservation;

import com.lankastay.backend.entity.Reservation;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record ReservationResponse(
        Long id, String reservationCode, String reference, Long hotelId, LocalDate checkIn, LocalDate checkOut,
        Integer nights, Integer adults, Integer children, Integer rooms, Long roomId, BigDecimal roomRate,
        BigDecimal subtotalAmount, BigDecimal discountAmount, BigDecimal totalAmount, BigDecimal estimatedTotal,
        Long appliedOfferId, String offerTitleSnapshot, String status, String paymentStatus,
        String assignmentState, String assignedRoomNumber, Long assignedPhysicalRoomId, List<Long> assignedPhysicalRoomIds,
        GuestResponse guest, List<ReservationItemResponse> items,
        String specialRequests, String estimatedArrivalTime, LocalDateTime cancelledAt, String cancellationReason,
        String cancellationNote, LocalDateTime createdAt, LocalDateTime updatedAt
) {
    public record GuestResponse(String name, String email, String phone) {}

    public static ReservationResponse from(Reservation reservation, List<ReservationItemResponse> items) {
        return from(reservation, items, reservation.getAssignedPhysicalRoomId() == null
                ? List.of() : List.of(reservation.getAssignedPhysicalRoomId()));
    }

    public static ReservationResponse from(Reservation reservation, List<ReservationItemResponse> items, List<Long> physicalIds) {
        ReservationItemResponse first = items.isEmpty() ? null : items.get(0);
        return new ReservationResponse(reservation.getId(), reservation.getReservationCode(), reservation.getReservationCode(),
                reservation.getHotelId(), reservation.getCheckIn(), reservation.getCheckOut(), reservation.getNumberOfNights(),
                reservation.getAdults(), reservation.getChildren(), first == null ? 0 : first.quantity(),
                first == null ? null : first.roomId(), first == null ? BigDecimal.ZERO : first.nightlyRateSnapshot(),
                reservation.getSubtotalAmount(), reservation.getDiscountAmount(), reservation.getTotalAmount(),
                reservation.getTotalAmount(), reservation.getAppliedOfferId(), reservation.getOfferTitleSnapshot(),
                reservation.getReservationStatus().name(), reservation.getPaymentStatus().name(),
                reservation.getAssignmentState().name(), reservation.getAssignedRoomNumber(), reservation.getAssignedPhysicalRoomId(), physicalIds,
                new GuestResponse(reservation.getGuestName(), reservation.getGuestEmail(), reservation.getGuestPhone()),
                items, reservation.getSpecialRequests(), reservation.getEstimatedArrivalTime(), reservation.getCancelledAt(),
                reservation.getCancellationReason(), reservation.getCancellationNote(), reservation.getCreatedAt(), reservation.getUpdatedAt());
    }
}
