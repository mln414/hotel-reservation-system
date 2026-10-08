package com.lankastay.backend.service.reservation.observer;

import java.util.UUID;

public record ReservationEvent(Long reservationId, UUID customerId, ReservationEventType eventType) {
}
