package com.lankastay.backend.dto.reservation;

import com.lankastay.backend.entity.ReservationItem;
import java.math.BigDecimal;

public record ReservationItemResponse(Long id, Long roomId, Long roomTypeId, Long rateId, Integer quantity,
                                      BigDecimal nightlyRateSnapshot, BigDecimal totalPrice, String roomName) {
    public static ReservationItemResponse from(ReservationItem item) {
        return new ReservationItemResponse(item.getId(), item.getRoomId(), item.getRoomId(), item.getRoomRateId(),
                item.getQuantity(), item.getNightlyRate(), item.getTotalPrice(), item.getRoomNameSnapshot());
    }
}
