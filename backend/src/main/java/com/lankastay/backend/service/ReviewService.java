// SE2030 LankaStay - Customer Review Management and Moderation
package com.lankastay.backend.service;

import com.lankastay.backend.dto.review.*;
import com.lankastay.backend.entity.Hotel;
import com.lankastay.backend.entity.Review;
import com.lankastay.backend.entity.ReviewStatus;
import com.lankastay.backend.entity.StaffRole;
import com.lankastay.backend.entity.StaffUser;
import com.lankastay.backend.exception.BusinessRuleException;
import com.lankastay.backend.exception.ResourceNotFoundException;
import com.lankastay.backend.repository.HotelRepository;
import com.lankastay.backend.repository.ReviewRepository;
import com.lankastay.backend.repository.StaffUserRepository;
import com.lankastay.backend.security.StaffPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final HotelRepository hotelRepository;
    private final StaffUserRepository staffUserRepository;

    public ReviewService(ReviewRepository reviewRepository,
                         HotelRepository hotelRepository,
                         StaffUserRepository staffUserRepository) {
        this.reviewRepository = reviewRepository;
        this.hotelRepository = hotelRepository;
        this.staffUserRepository = staffUserRepository;
    }

    // ==========================================
    // Public / Customer Review Actions
    // ==========================================

    @Transactional
    public ReviewResponse submitReview(CreateReviewRequest req, UUID customerId) {
        Hotel hotel = hotelRepository.findById(req.hotelId())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: " + req.hotelId()));

        Review review = new Review();
        review.setHotelId(hotel.getId());
        review.setCustomerId(customerId);
        review.setReservationId(req.reservationId());
        review.setGuestName(req.guestName().trim());
        review.setGuestEmail(req.guestEmail().trim().toLowerCase(Locale.ROOT));
        review.setRating(roundToOneDecimal(req.rating()));
        review.setCleanlinessRating(req.cleanlinessRating() != null ? roundToOneDecimal(req.cleanlinessRating()) : null);
        review.setStaffRating(req.staffRating() != null ? roundToOneDecimal(req.staffRating()) : null);
        review.setFacilitiesRating(req.facilitiesRating() != null ? roundToOneDecimal(req.facilitiesRating()) : null);
        review.setLocationRating(req.locationRating() != null ? roundToOneDecimal(req.locationRating()) : null);
        review.setValueRating(req.valueRating() != null ? roundToOneDecimal(req.valueRating()) : null);
        review.setTitle(req.title().trim());
        review.setComment(req.comment().trim());
        review.setTripType(req.tripType());
        review.setRoomType(req.roomType());
        review.setStatus(ReviewStatus.PENDING);
        review.setImages(req.images() != null ? req.images() : new ArrayList<>());

        if (req.reservationId() != null) {
            review.setVerifiedStay(true);
        }

        Review saved = reviewRepository.save(review);
        return ReviewResponse.from(saved, hotel.getName());
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getApprovedReviewsForHotel(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: " + hotelId));

        return reviewRepository.findByHotelIdAndStatusOrderByCreatedAtDesc(hotelId, ReviewStatus.APPROVED)
                .stream()
                .map(r -> ReviewResponse.from(r, hotel.getName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ReviewSummaryResponse getHotelReviewSummary(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: " + hotelId));

        long totalApproved = reviewRepository.countByHotelIdAndStatus(hotelId, ReviewStatus.APPROVED);
        Double avgRating = reviewRepository.calculateAverageRating(hotelId, ReviewStatus.APPROVED);
        Double avgCleanliness = reviewRepository.calculateAverageCleanliness(hotelId, ReviewStatus.APPROVED);
        Double avgStaff = reviewRepository.calculateAverageStaff(hotelId, ReviewStatus.APPROVED);
        Double avgFacilities = reviewRepository.calculateAverageFacilities(hotelId, ReviewStatus.APPROVED);
        Double avgLocation = reviewRepository.calculateAverageLocation(hotelId, ReviewStatus.APPROVED);
        Double avgValue = reviewRepository.calculateAverageValue(hotelId, ReviewStatus.APPROVED);

        Map<Integer, Long> starCounts = new HashMap<>();
        Map<Integer, Double> starPercentages = new HashMap<>();

        for (int star = 5; star >= 1; star--) {
            long count = reviewRepository.countByStarRating(hotelId, ReviewStatus.APPROVED, star);
            starCounts.put(star, count);
            double pct = totalApproved > 0 ? ((double) count / totalApproved) * 100.0 : 0.0;
            starPercentages.put(star, roundToOneDecimal(pct));
        }

        return new ReviewSummaryResponse(
                hotelId,
                hotel.getName(),
                avgRating != null ? roundToOneDecimal(avgRating) : 0.0,
                totalApproved,
                avgCleanliness != null ? roundToOneDecimal(avgCleanliness) : 0.0,
                avgStaff != null ? roundToOneDecimal(avgStaff) : 0.0,
                avgFacilities != null ? roundToOneDecimal(avgFacilities) : 0.0,
                avgLocation != null ? roundToOneDecimal(avgLocation) : 0.0,
                avgValue != null ? roundToOneDecimal(avgValue) : 0.0,
                starCounts,
                starPercentages
        );
    }

    @Transactional
    public void incrementHelpfulCount(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with ID: " + reviewId));
        review.setHelpfulCount(review.getHelpfulCount() + 1);
        reviewRepository.save(review);
    }

    // ==========================================
    // Management & Moderation Actions
    // ==========================================

    @Transactional(readOnly = true)
    public List<ReviewResponse> getManagementReviews(Long hotelId, ReviewStatus status, Double minRating,
                                                     String search, StaffPrincipal principal) {
        Long scopedHotelId = resolveScopedHotelId(hotelId, principal);

        Map<Long, String> hotelNames = new HashMap<>();
        hotelRepository.findAll().forEach(h -> hotelNames.put(h.getId(), h.getName()));

        return reviewRepository.filterManagementReviews(scopedHotelId, status, minRating, search)
                .stream()
                .filter(r -> isStaffAuthorizedForHotel(principal, r.getHotelId()))
                .map(r -> ReviewResponse.from(r, hotelNames.getOrDefault(r.getHotelId(), "Unknown")))
                .toList();
    }

    @Transactional(readOnly = true)
    public ReviewResponse getReviewById(Long id, StaffPrincipal principal) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with ID: " + id));

        if (!isStaffAuthorizedForHotel(principal, review.getHotelId())) {
            throw new AccessDeniedException("You are not authorized to access reviews for this hotel.");
        }

        String hotelName = hotelRepository.findById(review.getHotelId())
                .map(Hotel::getName).orElse("Unknown");

        return ReviewResponse.from(review, hotelName);
    }

    @Transactional
    public ReviewResponse updateReviewStatus(Long id, ReviewStatus newStatus, String moderationNote,
                                            StaffPrincipal principal) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with ID: " + id));

        if (!isStaffAuthorizedForHotel(principal, review.getHotelId())) {
            throw new AccessDeniedException("You are not authorized to moderate reviews for this hotel.");
        }

        review.setStatus(newStatus);
        review.setModerationNote(moderationNote);
        review.setModeratedBy(principal != null ? principal.id() : null);
        review.setModeratedAt(LocalDateTime.now());

        Review saved = reviewRepository.save(review);

        // Recalculate and update the hotel's aggregated rating & review count
        recalculateHotelRating(saved.getHotelId());

        String hotelName = hotelRepository.findById(saved.getHotelId())
                .map(Hotel::getName).orElse("Unknown");

        return ReviewResponse.from(saved, hotelName);
    }

    @Transactional
    public ReviewResponse replyToReview(Long id, String replyText, StaffPrincipal principal) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with ID: " + id));

        if (!isStaffAuthorizedForHotel(principal, review.getHotelId())) {
            throw new AccessDeniedException("You are not authorized to reply to reviews for this hotel.");
        }

        if (review.getStatus() != ReviewStatus.APPROVED) {
            throw new BusinessRuleException("Can only post official management replies to APPROVED reviews.");
        }

        String staffName = principal != null ? (principal.firstName() + " " + principal.lastName()).trim() : "Management";

        review.setManagementReply(replyText.trim());
        review.setRepliedBy(principal != null ? principal.id() : null);
        review.setRepliedByName(staffName);
        review.setRepliedAt(LocalDateTime.now());

        Review saved = reviewRepository.save(review);

        String hotelName = hotelRepository.findById(saved.getHotelId())
                .map(Hotel::getName).orElse("Unknown");

        return ReviewResponse.from(saved, hotelName);
    }

    @Transactional
    public void deleteReview(Long id, StaffPrincipal principal) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with ID: " + id));

        if (!isStaffAuthorizedForHotel(principal, review.getHotelId())) {
            throw new AccessDeniedException("You are not authorized to delete reviews for this hotel.");
        }

        Long hotelId = review.getHotelId();
        reviewRepository.delete(review);

        // Update hotel ratings after deletion
        recalculateHotelRating(hotelId);
    }

    @Transactional(readOnly = true)
    public ReviewStatsResponse getReviewStats(StaffPrincipal principal) {
        long total = reviewRepository.count();
        long pending = reviewRepository.countByStatus(ReviewStatus.PENDING);
        long approved = reviewRepository.countByStatus(ReviewStatus.APPROVED);
        long rejected = reviewRepository.countByStatus(ReviewStatus.REJECTED);
        long flagged = reviewRepository.countByStatus(ReviewStatus.FLAGGED);

        Double avg = reviewRepository.findAll().stream()
                .filter(r -> r.getStatus() == ReviewStatus.APPROVED)
                .mapToDouble(Review::getRating)
                .average()
                .orElse(0.0);

        return new ReviewStatsResponse(total, pending, approved, rejected, flagged, roundToOneDecimal(avg));
    }

    private void recalculateHotelRating(Long hotelId) {
        hotelRepository.findById(hotelId).ifPresent(hotel -> {
            Double newAvg = reviewRepository.calculateAverageRating(hotelId, ReviewStatus.APPROVED);
            long newCount = reviewRepository.countByHotelIdAndStatus(hotelId, ReviewStatus.APPROVED);

            hotel.setRating(newAvg != null ? roundToOneDecimal(newAvg) : 0.0);
            hotel.setReviewCount((int) newCount);
            hotelRepository.save(hotel);
        });
    }

    private Long resolveScopedHotelId(Long requestedHotelId, StaffPrincipal principal) {
        if (principal != null && StaffRole.HOTEL_STAFF.name().equalsIgnoreCase(principal.role())) {
            StaffUser staffUser = staffUserRepository.findById(principal.id()).orElse(null);
            if (staffUser != null && staffUser.getAssignedHotelId() != null) {
                return staffUser.getAssignedHotelId();
            }
        }
        return requestedHotelId;
    }

    private boolean isStaffAuthorizedForHotel(StaffPrincipal principal, Long hotelId) {
        if (principal == null) return false;
        if (StaffRole.MANAGER.name().equalsIgnoreCase(principal.role())) return true;
        if (StaffRole.HOTEL_STAFF.name().equalsIgnoreCase(principal.role())) {
            StaffUser staffUser = staffUserRepository.findById(principal.id()).orElse(null);
            return staffUser != null && staffUser.getAssignedHotelId() != null && staffUser.getAssignedHotelId().equals(hotelId);
        }
        return false;
    }

    private double roundToOneDecimal(double val) {
        return BigDecimal.valueOf(val).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}
