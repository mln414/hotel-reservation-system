package com.lankastay.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name = "reservation_physical_rooms")
public class ReservationPhysicalRoom {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "reservation_id", nullable = false) private Long reservationId;
    @Column(name = "physical_room_id", nullable = false) private Long physicalRoomId;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @PrePersist void create() { createdAt = LocalDateTime.now(); }
    public Long getId() { return id; }
    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long value) { reservationId = value; }
    public Long getPhysicalRoomId() { return physicalRoomId; }
    public void setPhysicalRoomId(Long value) { physicalRoomId = value; }
}
