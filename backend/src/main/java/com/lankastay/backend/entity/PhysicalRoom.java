package com.lankastay.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "physical_rooms")
public class PhysicalRoom {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "hotel_id", nullable = false) private Long hotelId;
    @Column(name = "room_type_id", nullable = false) private Long roomTypeId;
    @Column(name = "room_number", nullable = false, length = 50) private String roomNumber;
    @Column(name = "room_number_key", nullable = false, length = 50) private String roomNumberKey;
    @Column(length = 50) private String floor;
    @Column(length = 100) private String wing;
    @Column(name = "base_operational_status", nullable = false, length = 20) private String baseOperationalStatus = "AVAILABLE";
    @Column(name = "room_condition", nullable = false, length = 30) private String condition = "READY";
    @Column(length = 1000) private String notes;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;

    @PrePersist void create() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void update() { updatedAt = LocalDateTime.now(); }
    public Long getId() { return id; }
    public Long getHotelId() { return hotelId; }
    public void setHotelId(Long value) { hotelId = value; }
    public Long getRoomTypeId() { return roomTypeId; }
    public void setRoomTypeId(Long value) { roomTypeId = value; }
    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String value) { roomNumber = value; }
    public String getRoomNumberKey() { return roomNumberKey; }
    public void setRoomNumberKey(String value) { roomNumberKey = value; }
    public String getFloor() { return floor; }
    public void setFloor(String value) { floor = value; }
    public String getWing() { return wing; }
    public void setWing(String value) { wing = value; }
    public String getBaseOperationalStatus() { return baseOperationalStatus; }
    public void setBaseOperationalStatus(String value) { baseOperationalStatus = value; }
    public String getCondition() { return condition; }
    public void setCondition(String value) { condition = value; }
    public String getNotes() { return notes; }
    public void setNotes(String value) { notes = value; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
