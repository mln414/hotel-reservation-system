package com.lankastay.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "physical_room_blocks")
public class PhysicalRoomBlock {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "physical_room_id", nullable = false) private Long physicalRoomId;
    @Column(name = "block_type", nullable = false, length = 20) private String type;
    @Column(nullable = false, length = 500) private String reason;
    @Column(name = "from_date", nullable = false) private LocalDate fromDate;
    @Column(name = "through_date", nullable = false) private LocalDate throughDate;
    @Column(name = "return_state", nullable = false, length = 20) private String returnState;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @PrePersist void create() { createdAt = LocalDateTime.now(); }
    public Long getId() { return id; }
    public Long getPhysicalRoomId() { return physicalRoomId; }
    public void setPhysicalRoomId(Long value) { physicalRoomId = value; }
    public String getType() { return type; }
    public void setType(String value) { type = value; }
    public String getReason() { return reason; }
    public void setReason(String value) { reason = value; }
    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate value) { fromDate = value; }
    public LocalDate getThroughDate() { return throughDate; }
    public void setThroughDate(LocalDate value) { throughDate = value; }
    public String getReturnState() { return returnState; }
    public void setReturnState(String value) { returnState = value; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
