package com.lankastay.backend.dto.reservation;

import java.time.LocalDate;

public record AvailabilityResponse(boolean available, int availableQuantity, LocalDate unavailableDate, String message) {}
