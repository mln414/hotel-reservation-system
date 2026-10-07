package com.lankastay.backend.service.reservation.observer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class ReservationLifecycleLogObserver implements ReservationObserver {
    private static final Logger logger = LoggerFactory.getLogger(ReservationLifecycleLogObserver.class);

    @Override
    public void onReservationEvent(ReservationEvent event) {
        logger.info("Reservation {} event received for reservation {} and customer {}.",
                event.eventType(), event.reservationId(), event.customerId());
    }
}
