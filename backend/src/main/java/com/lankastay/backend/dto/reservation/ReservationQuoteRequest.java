package com.lankastay.backend.dto.reservation;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ReservationQuoteRequest(
        @NotNull Long hotelId,
        @NotNull Long roomId,
        @NotNull Long rateId,
        @NotNull LocalDate checkIn,
        @NotNull LocalDate checkOut,
        @NotNull @Min(1) Integer adults,
        @NotNull @Min(0) Integer children,
        @NotNull @Min(1) Integer quantity,
        Long offerId
) {
    public ReservationQuoteRequest(Long hotelId, Long roomId, Long rateId, LocalDate checkIn, LocalDate checkOut,
                                   Integer adults, Integer children, Integer quantity) {
        this(hotelId, roomId, rateId, checkIn, checkOut, adults, children, quantity, null);
    }
}
