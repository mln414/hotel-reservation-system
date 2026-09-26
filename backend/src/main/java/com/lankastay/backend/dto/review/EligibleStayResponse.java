package com.lankastay.backend.dto.review;

public record EligibleStayResponse(
        Long reservationId,
        String reservationCode,
        Long hotelId,
        String hotelName,
        String hotelDestination,
        String hotelImage,
        String checkIn,
        String checkOut,
        String roomName,
        boolean eligible,
        boolean alreadyReviewed,
        Long reviewId
) {}
