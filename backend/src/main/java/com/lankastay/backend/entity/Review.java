package com.lankastay.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "reviews", indexes = {
        @Index(name = "idx_reviews_hotel_status_created", columnList = "hotel_id,status,created_at"),
        @Index(name = "idx_reviews_customer_created", columnList = "customer_id,created_at"),
        @Index(name = "idx_reviews_status", columnList = "status")
})
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private CustomerUser customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hotel_id", nullable = false)
    private Hotel hotel;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reservation_id", nullable = false, unique = true)
    private Reservation reservation;

    @Column(name = "overall_rating", nullable = false)
    private int overallRating;

    @Column(name = "cleanliness_rating")
    private Integer cleanlinessRating;

    @Column(name = "comfort_rating")
    private Integer comfortRating;

    @Column(name = "staff_service_rating")
    private Integer staffServiceRating;

    @Column(name = "facilities_rating")
    private Integer facilitiesRating;

    @Column(name = "location_rating")
    private Integer locationRating;

    @Column(name = "value_for_money_rating")
    private Integer valueForMoneyRating;

    @Column(name = "title", nullable = false, length = 120)
    private String title;

    @Column(name = "comment", nullable = false, columnDefinition = "TEXT")
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private ReviewStatus status = ReviewStatus.ACTIVE;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "review_photos", joinColumns = @JoinColumn(name = "review_id"))
    @Column(name = "photo_url", nullable = false, length = 500)
    @OrderColumn(name = "sort_order")
    private List<String> photos = new ArrayList<>();

    @Column(name = "customer_updated_at")
    private Instant customerUpdatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "moderation_reason", length = 100)
    private String moderationReason;

    @Column(name = "moderation_note", columnDefinition = "TEXT")
    private String moderationNote;

    @Column(name = "hidden_at")
    private Instant hiddenAt;

    @Column(name = "hidden_by_staff_id")
    private UUID hiddenByStaffId;

    @Column(name = "management_response", columnDefinition = "TEXT")
    private String managementResponse;

    @Column(name = "response_created_at")
    private Instant responseCreatedAt;

    @Column(name = "response_updated_at")
    private Instant responseUpdatedAt;

    @Column(name = "response_by_staff_id")
    private UUID responseByStaffId;

    @Column(name = "response_role", length = 50)
    private String responseRole;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (status == null) status = ReviewStatus.ACTIVE;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public Review() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CustomerUser getCustomer() { return customer; }
    public void setCustomer(CustomerUser customer) { this.customer = customer; }

    public Hotel getHotel() { return hotel; }
    public void setHotel(Hotel hotel) { this.hotel = hotel; }

    public Reservation getReservation() { return reservation; }
    public void setReservation(Reservation reservation) { this.reservation = reservation; }

    public int getOverallRating() { return overallRating; }
    public void setOverallRating(int overallRating) { this.overallRating = overallRating; }

    public Integer getCleanlinessRating() { return cleanlinessRating; }
    public void setCleanlinessRating(Integer cleanlinessRating) { this.cleanlinessRating = cleanlinessRating; }

    public Integer getComfortRating() { return comfortRating; }
    public void setComfortRating(Integer comfortRating) { this.comfortRating = comfortRating; }

    public Integer getStaffServiceRating() { return staffServiceRating; }
    public void setStaffServiceRating(Integer staffServiceRating) { this.staffServiceRating = staffServiceRating; }

    public Integer getFacilitiesRating() { return facilitiesRating; }
    public void setFacilitiesRating(Integer facilitiesRating) { this.facilitiesRating = facilitiesRating; }

    public Integer getLocationRating() { return locationRating; }
    public void setLocationRating(Integer locationRating) { this.locationRating = locationRating; }

    public Integer getValueForMoneyRating() { return valueForMoneyRating; }
    public void setValueForMoneyRating(Integer valueForMoneyRating) { this.valueForMoneyRating = valueForMoneyRating; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public ReviewStatus getStatus() { return status; }
    public void setStatus(ReviewStatus status) { this.status = status; }

    public List<String> getPhotos() { return photos; }
    public void setPhotos(List<String> photos) {
        if (this.photos == null) {
            this.photos = new ArrayList<>();
        } else {
            this.photos.clear();
        }
        if (photos != null) {
            this.photos.addAll(photos);
        }
    }

    public Instant getCustomerUpdatedAt() { return customerUpdatedAt; }
    public void setCustomerUpdatedAt(Instant customerUpdatedAt) { this.customerUpdatedAt = customerUpdatedAt; }

    public Instant getDeletedAt() { return deletedAt; }
    public void setDeletedAt(Instant deletedAt) { this.deletedAt = deletedAt; }

    public String getModerationReason() { return moderationReason; }
    public void setModerationReason(String moderationReason) { this.moderationReason = moderationReason; }

    public String getModerationNote() { return moderationNote; }
    public void setModerationNote(String moderationNote) { this.moderationNote = moderationNote; }

    public Instant getHiddenAt() { return hiddenAt; }
    public void setHiddenAt(Instant hiddenAt) { this.hiddenAt = hiddenAt; }

    public UUID getHiddenByStaffId() { return hiddenByStaffId; }
    public void setHiddenByStaffId(UUID hiddenByStaffId) { this.hiddenByStaffId = hiddenByStaffId; }

    public String getManagementResponse() { return managementResponse; }
    public void setManagementResponse(String managementResponse) { this.managementResponse = managementResponse; }

    public Instant getResponseCreatedAt() { return responseCreatedAt; }
    public void setResponseCreatedAt(Instant responseCreatedAt) { this.responseCreatedAt = responseCreatedAt; }

    public Instant getResponseUpdatedAt() { return responseUpdatedAt; }
    public void setResponseUpdatedAt(Instant responseUpdatedAt) { this.responseUpdatedAt = responseUpdatedAt; }

    public UUID getResponseByStaffId() { return responseByStaffId; }
    public void setResponseByStaffId(UUID responseByStaffId) { this.responseByStaffId = responseByStaffId; }

    public String getResponseRole() { return responseRole; }
    public void setResponseRole(String responseRole) { this.responseRole = responseRole; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
