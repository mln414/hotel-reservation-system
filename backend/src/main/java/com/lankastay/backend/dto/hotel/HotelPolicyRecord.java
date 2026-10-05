package com.lankastay.backend.dto.hotel;

/** A customer-facing policy persisted with its hotel record. */
public record HotelPolicyRecord(
        String id,
        String title,
        String category,
        String summary,
        String details,
        String status
) {}
