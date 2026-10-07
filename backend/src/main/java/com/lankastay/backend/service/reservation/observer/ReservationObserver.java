package com.lankastay.backend.service.reservation.observer;

public interface ReservationObserver {
    void onReservationEvent(ReservationEvent event);
}
