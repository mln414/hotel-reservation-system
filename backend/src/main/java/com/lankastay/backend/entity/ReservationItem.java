package com.lankastay.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "reservation_items")
public class ReservationItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "reservation_id", nullable = false)
    private Long reservationId;
    @Column(name = "room_id", nullable = false)
    private Long roomId;
    @Column(name = "room_rate_id", nullable = false)
    private Long roomRateId;
    @Column(nullable = false)
    private Integer quantity;
    @Column(name = "nightly_rate", nullable = false, precision = 14, scale = 2)
    private BigDecimal nightlyRate;
    @Column(name = "total_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalPrice;
    @Column(name = "room_name_snapshot", length = 150)
    private String roomNameSnapshot;

    public Long getId() { return id; }
    public void setId(Long value) { id = value; }
    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long value) { reservationId = value; }
    public Long getRoomId() { return roomId; }
    public void setRoomId(Long value) { roomId = value; }
    public Long getRoomRateId() { return roomRateId; }
    public void setRoomRateId(Long value) { roomRateId = value; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer value) { quantity = value; }
    public BigDecimal getNightlyRate() { return nightlyRate; }
    public void setNightlyRate(BigDecimal value) { nightlyRate = value; }
    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal value) { totalPrice = value; }
    public String getRoomNameSnapshot() { return roomNameSnapshot; }
    public void setRoomNameSnapshot(String value) { roomNameSnapshot = value; }
}
