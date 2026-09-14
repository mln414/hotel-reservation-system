package com.lankastay.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reservations")
public class Reservation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "reservation_code", nullable = false, unique = true, length = 32)
    private String reservationCode;
    @Column(name = "hotel_id", nullable = false)
    private Long hotelId;
    @Column(name = "customer_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID customerId;
    @Column(name = "guest_name", nullable = false, length = 150)
    private String guestName;
    @Column(name = "guest_email", nullable = false, length = 254)
    private String guestEmail;
    @Column(name = "guest_phone", length = 30)
    private String guestPhone;
    @Column(name = "check_in", nullable = false)
    private LocalDate checkIn;
    @Column(name = "check_out", nullable = false)
    private LocalDate checkOut;
    @Column(name = "number_of_nights", nullable = false)
    private Integer numberOfNights;
    @Column(nullable = false)
    private Integer adults;
    @Column(nullable = false)
    private Integer children;
    @Column(name = "subtotal_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal subtotalAmount = BigDecimal.ZERO;
    @Column(name = "discount_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;
    @Column(name = "applied_offer_id")
    private Long appliedOfferId;
    @Column(name = "offer_title_snapshot", length = 200)
    private String offerTitleSnapshot;
    @Column(name = "discount_type_snapshot", length = 30)
    private String discountTypeSnapshot;
    @Column(name = "discount_value_snapshot", precision = 14, scale = 2)
    private BigDecimal discountValueSnapshot;
    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;
    @Column(name = "tax_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;
    @Column(name = "net_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal netAmount;
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 30)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;
    @Enumerated(EnumType.STRING)
    @Column(name = "reservation_status", nullable = false, length = 30)
    private ReservationStatus reservationStatus = ReservationStatus.CONFIRMED;
    @Enumerated(EnumType.STRING)
    @Column(name = "assignment_state", nullable = false, length = 30)
    private AssignmentState assignmentState = AssignmentState.UNASSIGNED;
    @Column(name = "assigned_room_number", length = 50)
    private String assignedRoomNumber;
    @Column(name = "special_requests", columnDefinition = "TEXT")
    private String specialRequests;
    @Column(name = "estimated_arrival_time", length = 20)
    private String estimatedArrivalTime;
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;
    @Column(name = "cancellation_reason", length = 300)
    private String cancellationReason;
    @Column(name = "cancellation_note", length = 500)
    private String cancellationNote;
    @Column(name = "cancelled_by_type", length = 30)
    private String cancelledByType;
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getReservationCode() { return reservationCode; }
    public void setReservationCode(String value) { reservationCode = value; }
    public Long getHotelId() { return hotelId; }
    public void setHotelId(Long value) { hotelId = value; }
    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID value) { customerId = value; }
    public String getGuestName() { return guestName; }
    public void setGuestName(String value) { guestName = value; }
    public String getGuestEmail() { return guestEmail; }
    public void setGuestEmail(String value) { guestEmail = value; }
    public String getGuestPhone() { return guestPhone; }
    public void setGuestPhone(String value) { guestPhone = value; }
    public LocalDate getCheckIn() { return checkIn; }
    public void setCheckIn(LocalDate value) { checkIn = value; }
    public LocalDate getCheckOut() { return checkOut; }
    public void setCheckOut(LocalDate value) { checkOut = value; }
    public Integer getNumberOfNights() { return numberOfNights; }
    public void setNumberOfNights(Integer value) { numberOfNights = value; }
    public Integer getAdults() { return adults; }
    public void setAdults(Integer value) { adults = value; }
    public Integer getChildren() { return children; }
    public void setChildren(Integer value) { children = value; }
    public BigDecimal getSubtotalAmount() { return subtotalAmount; }
    public void setSubtotalAmount(BigDecimal value) { subtotalAmount = value; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal value) { discountAmount = value; }
    public Long getAppliedOfferId() { return appliedOfferId; }
    public void setAppliedOfferId(Long value) { appliedOfferId = value; }
    public String getOfferTitleSnapshot() { return offerTitleSnapshot; }
    public void setOfferTitleSnapshot(String value) { offerTitleSnapshot = value; }
    public String getDiscountTypeSnapshot() { return discountTypeSnapshot; }
    public void setDiscountTypeSnapshot(String value) { discountTypeSnapshot = value; }
    public BigDecimal getDiscountValueSnapshot() { return discountValueSnapshot; }
    public void setDiscountValueSnapshot(BigDecimal value) { discountValueSnapshot = value; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal value) { totalAmount = value; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal value) { taxAmount = value; }
    public BigDecimal getNetAmount() { return netAmount; }
    public void setNetAmount(BigDecimal value) { netAmount = value; }
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus value) { paymentStatus = value; }
    public ReservationStatus getReservationStatus() { return reservationStatus; }
    public void setReservationStatus(ReservationStatus value) { reservationStatus = value; }
    public AssignmentState getAssignmentState() { return assignmentState; }
    public void setAssignmentState(AssignmentState value) { assignmentState = value; }
    public String getAssignedRoomNumber() { return assignedRoomNumber; }
    public void setAssignedRoomNumber(String value) { assignedRoomNumber = value; }
    public String getSpecialRequests() { return specialRequests; }
    public void setSpecialRequests(String value) { specialRequests = value; }
    public String getEstimatedArrivalTime() { return estimatedArrivalTime; }
    public void setEstimatedArrivalTime(String value) { estimatedArrivalTime = value; }
    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime value) { cancelledAt = value; }
    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String value) { cancellationReason = value; }
    public String getCancellationNote() { return cancellationNote; }
    public void setCancellationNote(String value) { cancellationNote = value; }
    public String getCancelledByType() { return cancelledByType; }
    public void setCancelledByType(String value) { cancelledByType = value; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
