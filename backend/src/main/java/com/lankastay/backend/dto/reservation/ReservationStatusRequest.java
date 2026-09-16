package com.lankastay.backend.dto.reservation;

import com.lankastay.backend.entity.PaymentStatus;
import com.lankastay.backend.entity.ReservationStatus;

public record ReservationStatusRequest(ReservationStatus reservationStatus, PaymentStatus paymentStatus) {}
