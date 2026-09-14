package com.lankastay.backend.dto.reservation;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record CreateReservationRequest(
        @NotNull Long hotelId,
        @NotNull Long roomId,
        @NotNull Long rateId,
        @NotNull LocalDate checkIn,
        @NotNull LocalDate checkOut,
        @NotNull @Min(1) Integer adults,
        @NotNull @Min(0) Integer children,
        @NotNull @Min(1) Integer quantity,
        @NotBlank @Size(max = 80) String guestFirstName,
        @NotBlank @Size(max = 80) String guestLastName,
        @Email @NotBlank @Size(max = 254) String guestEmail,
        @Size(max = 30) String guestPhone,
        @Size(max = 2000) String specialRequests,
        @Size(max = 20) String estimatedArrivalTime,
        Long offerId
) {
    public CreateReservationRequest(Long hotelId, Long roomId, Long rateId, LocalDate checkIn, LocalDate checkOut,
                                    Integer adults, Integer children, Integer quantity, String guestFirstName,
                                    String guestLastName, String guestEmail, String guestPhone,
                                    String specialRequests, String estimatedArrivalTime) {
        this(hotelId, roomId, rateId, checkIn, checkOut, adults, children, quantity, guestFirstName, guestLastName,
                guestEmail, guestPhone, specialRequests, estimatedArrivalTime, null);
    }
}
