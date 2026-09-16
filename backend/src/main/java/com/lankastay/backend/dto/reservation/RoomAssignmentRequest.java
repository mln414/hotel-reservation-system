package com.lankastay.backend.dto.reservation;

import jakarta.validation.constraints.Size;

public record RoomAssignmentRequest(@Size(max = 50) String roomNumber, Boolean remove) {}
