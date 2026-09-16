// SE2030 LankaStay - Customer Review Management and Moderation
package com.lankastay.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hotel_id", nullable = false)
    private Long hotelId;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "reservation_id")
    private Long reservationId;

    @Column(name = "guest_name", nullable = false, length = 150)
    private String guestName;

    @Column(name = "guest_email", nullable = false, length = 150)
    private String guestEmail;

    @Column(nullable = false)
    private Double rating;

    @Column(name = "cleanliness_rating")
    private Double cleanlinessRating;

    @Column(name = "staff_rating")
    private Double staffRating;

    @Column(name = "facilities_rating")
    private Double facilitiesRating;

    @Column(name = "location_rating")
    private Double locationRating;

    @Column(name = "value_rating")
    private Double valueRating;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String comment;

    @Column(name = "trip_type", length = 50)
    private String tripType;

    @Column(name = "room_type", length = 100)
    private String roomType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReviewStatus status = ReviewStatus.PENDING;

    @Column(name = "moderation_note", length = 500)
    private String moderationNote;

    @Column(name = "moderated_by")
    private UUID moderatedBy;

    @Column(name = "moderated_at")
    private LocalDateTime moderatedAt;

    @Column(name = "is_verified_stay", nullable = false)
    private boolean isVerifiedStay = false;

    @Column(name = "helpful_count", nullable = false)
    private int helpfulCount = 0;

    @Column(name = "management_reply", columnDefinition = "TEXT")
    private String managementReply;

    @Column(name = "replied_by")
    private UUID repliedBy;

    @Column(name = "replied_by_name", length = 100)
    private String repliedByName;

    @Column(name = "replied_at")
    private LocalDateTime repliedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "review_images", joinColumns = @JoinColumn(name = "review_id"))
    @OrderColumn(name = "display_order")
    @Column(name = "image_url", length = 500, nullable = false)
    private List<String> images = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = ReviewStatus.PENDING;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Review() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getHotelId() { return hotelId; }
    public void setHotelId(Long hotelId) { this.hotelId = hotelId; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public Long getReservationId() { return reservationId; }
    public void setReservationId(Long reservationId) { this.reservationId = reservationId; }

    public String getGuestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }

    public String getGuestEmail() { return guestEmail; }
    public void setGuestEmail(String guestEmail) { this.guestEmail = guestEmail; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public Double getCleanlinessRating() { return cleanlinessRating; }
    public void setCleanlinessRating(Double cleanlinessRating) { this.cleanlinessRating = cleanlinessRating; }

    public Double getStaffRating() { return staffRating; }
    public void setStaffRating(Double staffRating) { this.staffRating = staffRating; }

    public Double getFacilitiesRating() { return facilitiesRating; }
    public void setFacilitiesRating(Double facilitiesRating) { this.facilitiesRating = facilitiesRating; }

    public Double getLocationRating() { return locationRating; }
    public void setLocationRating(Double locationRating) { this.locationRating = locationRating; }

    public Double getValueRating() { return valueRating; }
    public void setValueRating(Double valueRating) { this.valueRating = valueRating; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getTripType() { return tripType; }
    public void setTripType(String tripType) { this.tripType = tripType; }

    public String getRoomType() { return roomType; }
    public void setRoomType(String roomType) { this.roomType = roomType; }

    public ReviewStatus getStatus() { return status; }
    public void setStatus(ReviewStatus status) { this.status = status; }

    public String getModerationNote() { return moderationNote; }
    public void setModerationNote(String moderationNote) { this.moderationNote = moderationNote; }

    public UUID getModeratedBy() { return moderatedBy; }
    public void setModeratedBy(UUID moderatedBy) { this.moderatedBy = moderatedBy; }

    public LocalDateTime getModeratedAt() { return moderatedAt; }
    public void setModeratedAt(LocalDateTime moderatedAt) { this.moderatedAt = moderatedAt; }

    public boolean isVerifiedStay() { return isVerifiedStay; }
    public void setVerifiedStay(boolean verifiedStay) { isVerifiedStay = verifiedStay; }

    public int getHelpfulCount() { return helpfulCount; }
    public void setHelpfulCount(int helpfulCount) { this.helpfulCount = helpfulCount; }

    public String getManagementReply() { return managementReply; }
    public void setManagementReply(String managementReply) { this.managementReply = managementReply; }

    public UUID getRepliedBy() { return repliedBy; }
    public void setRepliedBy(UUID repliedBy) { this.repliedBy = repliedBy; }

    public String getRepliedByName() { return repliedByName; }
    public void setRepliedByName(String repliedByName) { this.repliedByName = repliedByName; }

    public LocalDateTime getRepliedAt() { return repliedAt; }
    public void setRepliedAt(LocalDateTime repliedAt) { this.repliedAt = repliedAt; }

    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images != null ? images : new ArrayList<>(); }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
