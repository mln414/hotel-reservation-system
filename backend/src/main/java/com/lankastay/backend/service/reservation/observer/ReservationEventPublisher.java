package com.lankastay.backend.service.reservation.observer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

@Component
public class ReservationEventPublisher {
    private static final Logger logger = LoggerFactory.getLogger(ReservationEventPublisher.class);
    private final List<ReservationObserver> observers;

    public ReservationEventPublisher(List<ReservationObserver> observers) {
        this.observers = List.copyOf(observers);
    }

    public void publishAfterCommit(ReservationEvent event) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()
                || !TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException("Reservation events must be registered inside an active transaction.");
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                notifyObservers(event);
            }
        });
    }

    private void notifyObservers(ReservationEvent event) {
        for (ReservationObserver observer : observers) {
            try {
                observer.onReservationEvent(event);
            } catch (RuntimeException exception) {
                logger.error("Non-critical reservation observer {} failed for reservation {}.",
                        observer.getClass().getSimpleName(), event.reservationId(), exception);
            }
        }
    }
}
