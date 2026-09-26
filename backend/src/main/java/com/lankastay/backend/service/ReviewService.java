package com.lankastay.backend.service;

import com.lankastay.backend.dto.review.*;
import com.lankastay.backend.entity.*;
import com.lankastay.backend.exception.ConflictException;
import com.lankastay.backend.exception.ResourceNotFoundException;
import com.lankastay.backend.repository.DestinationRepository;
import com.lankastay.backend.repository.HotelRepository;
import com.lankastay.backend.repository.ReservationItemRepository;
import com.lankastay.backend.repository.ReservationRepository;
import com.lankastay.backend.repository.ReviewRepository;
import com.lankastay.backend.security.StaffPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReservationRepository reservationRepository;
    private final ReservationItemRepository reservationItemRepository;
    private final HotelRepository hotelRepository;
    private final DestinationRepository destinationRepository;
    private final SecurityAuditService auditService;

    private static final DateTimeFormatter MONTH_YEAR_FORMATTER =
            DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH).withZone(ZoneId.of("UTC"));

    public ReviewService(ReviewRepository reviewRepository,
                         ReservationRepository reservationRepository,
                         ReservationItemRepository reservationItemRepository,
                         HotelRepository hotelRepository,
                         DestinationRepository destinationRepository,
                         SecurityAuditService auditService) {
        this.reviewRepository = reviewRepository;
        this.reservationRepository = reservationRepository;
        this.reservationItemRepository = reservationItemRepository;
        this.hotelRepository = hotelRepository;
        this.destinationRepository = destinationRepository;
        this.auditService = auditService;
    }

    // =========================================================================
    // Customer Review Operations
    // =========================================================================

    public ReviewResponse createReview(CustomerUser customer, CreateReviewRequest request, String ipAddress) {
        Reservation reservation = reservationRepository.findById(request.reservationId())
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found with ID: " + request.reservationId()));

        if (!reservation.getCustomerId().equals(customer.getId())) {
            throw new AccessDeniedException("This reservation does not belong to your account.");
        }

        if (!isCompletedStay(reservation)) {
            throw new ConflictException("Only completed LankaStay reservations can be reviewed.");
        }

        // The review row is the source of truth. review_submitted_at is a
        // historical marker and must not block re-creation after a hard delete.
        if (reviewRepository.existsByReservationId(reservation.getId())) {
            throw new ConflictException("You have already reviewed this stay.");
        }

        Hotel hotel = hotelRepository.findById(reservation.getHotelId())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: " + reservation.getHotelId()));

        Review review = new Review();
        review.setCustomer(customer);
        review.setHotel(hotel);
        review.setReservation(reservation);
        review.setOverallRating(request.overallRating());
        review.setCleanlinessRating(request.cleanlinessRating());
        review.setComfortRating(request.comfortRating());
        review.setStaffServiceRating(request.staffServiceRating());
        review.setFacilitiesRating(request.facilitiesRating());
        review.setLocationRating(request.locationRating());
        review.setValueForMoneyRating(request.valueForMoneyRating());
        review.setTitle(request.title().trim());
        review.setComment(request.comment().trim());
        if (request.photos() != null && !request.photos().isEmpty()) {
            review.setPhotos(new ArrayList<>(request.photos().stream().filter(p -> p != null && !p.isBlank()).limit(5).toList()));
        }
        review.setStatus(ReviewStatus.ACTIVE);

        Review saved = reviewRepository.save(review);
        reservation.setReviewSubmittedAt(LocalDateTime.now());
        reservationRepository.save(reservation);
        syncHotelRating(hotel.getId());

        auditService.record(null, customer.getId(), SecurityEventType.REVIEW_CREATED, ipAddress, "SUCCESS");

        return toReviewResponse(saved);
    }

    public ReviewResponse updateReview(CustomerUser customer, Long reviewId, UpdateReviewRequest request, String ipAddress) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with ID: " + reviewId));

        if (!review.getCustomer().getId().equals(customer.getId())) {
            throw new AccessDeniedException("This review does not belong to your account.");
        }

        if (review.getStatus() != ReviewStatus.ACTIVE) {
            throw new ConflictException("Only active reviews can be edited.");
        }

        review.setOverallRating(request.overallRating());
        review.setCleanlinessRating(request.cleanlinessRating());
        review.setComfortRating(request.comfortRating());
        review.setStaffServiceRating(request.staffServiceRating());
        review.setFacilitiesRating(request.facilitiesRating());
        review.setLocationRating(request.locationRating());
        review.setValueForMoneyRating(request.valueForMoneyRating());
        review.setTitle(request.title().trim());
        review.setComment(request.comment().trim());
        if (request.photos() != null) {
            review.setPhotos(new ArrayList<>(request.photos().stream().filter(p -> p != null && !p.isBlank()).limit(5).toList()));
        }
        review.setCustomerUpdatedAt(Instant.now());

        Review updated = reviewRepository.save(review);
        syncHotelRating(review.getHotel().getId());

        auditService.record(null, customer.getId(), SecurityEventType.REVIEW_UPDATED, ipAddress, "SUCCESS");

        return toReviewResponse(updated);
    }

    public void deleteCustomerReview(CustomerUser customer, Long reviewId, String ipAddress) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with ID: " + reviewId));

        if (!review.getCustomer().getId().equals(customer.getId())) {
            throw new AccessDeniedException("This review does not belong to your account.");
        }

        Long hotelId = review.getHotel().getId();
        Reservation reservation = review.getReservation();
        reviewRepository.delete(review);
        reviewRepository.flush();

        // A deleted customer review no longer blocks a fresh review for the
        // same completed reservation. Keep the reservation marker consistent
        // with the review table so the eligibility API cannot report stale data.
        if (reservation != null) {
            reservation.setReviewSubmittedAt(null);
            reservationRepository.save(reservation);
        }

        syncHotelRating(hotelId);

        auditService.record(null, customer.getId(), SecurityEventType.REVIEW_DELETED_BY_CUSTOMER, ipAddress, "SUCCESS");
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getCustomerReviews(CustomerUser customer) {
        return reviewRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId())
                .stream()
                .map(this::toReviewResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EligibleStayResponse> getEligibleStays(CustomerUser customer) {
        List<Reservation> reservations = reservationRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
        List<EligibleStayResponse> result = new ArrayList<>();

        for (Reservation res : reservations) {
            boolean isCompleted = isCompletedStay(res);
            Optional<Review> existingReview = reviewRepository.findByReservationId(res.getId());
            // A hard-deleted review leaves no row and makes the stay eligible
            // again. Do not let the historical reservation marker become stale
            // eligibility state.
            boolean alreadyReviewed = existingReview.isPresent();
            Long reviewId = existingReview.map(Review::getId).orElse(null);

            Hotel hotel = hotelRepository.findById(res.getHotelId()).orElse(null);
            String hotelName = hotel != null ? hotel.getName() : "LankaStay Hotel";
            String destinationName = (hotel != null && hotel.getDestinationId() != null)
                    ? destinationRepository.findById(hotel.getDestinationId()).map(Destination::getName).orElse(hotel.getCity())
                    : (hotel != null ? hotel.getCity() : "Sri Lanka");
            String hotelImage = hotel != null ? hotel.getMainImage() : null;

            List<ReservationItem> items = reservationItemRepository.findByReservationId(res.getId());
            String roomName = (!items.isEmpty() && items.get(0).getRoomNameSnapshot() != null)
                    ? items.get(0).getRoomNameSnapshot()
                    : "Standard Room";

            result.add(new EligibleStayResponse(
                    res.getId(),
                    res.getReservationCode(),
                    res.getHotelId(),
                    hotelName,
                    destinationName,
                    hotelImage,
                    res.getCheckIn() != null ? res.getCheckIn().toString() : "",
                    res.getCheckOut() != null ? res.getCheckOut().toString() : "",
                    roomName,
                    isCompleted && !alreadyReviewed,
                    alreadyReviewed,
                    reviewId
            ));
        }

        return result;
    }

    // =========================================================================
    // Management Moderation & Review Operations
    // =========================================================================

    @Transactional(readOnly = true)
    public List<ReviewResponse> getManagementReviews(StaffPrincipal principal, Long hotelId, String search, Integer rating, ReviewStatus status) {
        Long scopedHotelId = resolveManagementHotelScope(principal, hotelId);

        List<Review> list;
        if (scopedHotelId != null) {
            list = reviewRepository.findByHotelIdOrderByCreatedAtDesc(scopedHotelId);
        } else {
            list = reviewRepository.findAllByOrderByCreatedAtDesc();
        }

        return list.stream()
                .filter(r -> status == null || r.getStatus() == status)
                .filter(r -> rating == null || r.getOverallRating() == rating)
                .filter(r -> {
                    if (search == null || search.isBlank()) return true;
                    String q = search.toLowerCase();
                    String guestName = (r.getReservation() != null && r.getReservation().getGuestName() != null)
                            ? r.getReservation().getGuestName().toLowerCase()
                            : "";
                    return guestName.contains(q) ||
                            r.getTitle().toLowerCase().contains(q) ||
                            r.getComment().toLowerCase().contains(q);
                })
                .map(this::toReviewResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReviewResponse getManagementReviewById(StaffPrincipal principal, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with ID: " + reviewId));
        verifyStaffPropertyScope(principal, review.getHotel().getId());
        return toReviewResponse(review);
    }

    public ReviewResponse hideReview(StaffPrincipal principal, Long reviewId, HideReviewRequest request, String ipAddress) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with ID: " + reviewId));
        verifyStaffPropertyScope(principal, review.getHotel().getId());

        if (review.getStatus() == ReviewStatus.DELETED_BY_CUSTOMER) {
            throw new ConflictException("Cannot hide a review that was already deleted by the guest.");
        }

        review.setStatus(ReviewStatus.HIDDEN_BY_MODERATION);
        review.setModerationReason(request.moderationReason().trim());
        review.setModerationNote(request.moderationNote() != null ? request.moderationNote().trim() : null);
        review.setHiddenAt(Instant.now());
        review.setHiddenByStaffId(principal.id());

        Review saved = reviewRepository.save(review);
        syncHotelRating(review.getHotel().getId());

        auditService.record(principal.id(), null, SecurityEventType.REVIEW_HIDDEN, ipAddress, "SUCCESS");

        return toReviewResponse(saved);
    }

    public ReviewResponse restoreReview(StaffPrincipal principal, Long reviewId, String ipAddress) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with ID: " + reviewId));
        verifyStaffPropertyScope(principal, review.getHotel().getId());

        if (review.getStatus() == ReviewStatus.DELETED_BY_CUSTOMER) {
            throw new ConflictException("Management cannot restore a review deleted by the customer.");
        }

        if (review.getStatus() != ReviewStatus.HIDDEN_BY_MODERATION) {
            throw new ConflictException("Only moderation-hidden reviews can be restored.");
        }

        review.setStatus(ReviewStatus.ACTIVE);
        review.setModerationReason(null);
        review.setModerationNote(null);
        review.setHiddenAt(null);
        review.setHiddenByStaffId(null);

        Review saved = reviewRepository.save(review);
        syncHotelRating(review.getHotel().getId());

        auditService.record(principal.id(), null, SecurityEventType.REVIEW_RESTORED, ipAddress, "SUCCESS");

        return toReviewResponse(saved);
    }

    public ReviewResponse addResponse(StaffPrincipal principal, Long reviewId, ManagementReviewResponseRequest request, String ipAddress) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with ID: " + reviewId));
        verifyStaffPropertyScope(principal, review.getHotel().getId());

        if (review.getStatus() != ReviewStatus.ACTIVE) {
            throw new ConflictException("Can only respond to active guest reviews.");
        }

        review.setManagementResponse(request.responseText().trim());
        review.setResponseRole(request.responseRole() != null && !request.responseRole().isBlank()
                ? request.responseRole().trim() : "Hotel Management");
        review.setResponseCreatedAt(Instant.now());
        review.setResponseUpdatedAt(null);
        review.setResponseByStaffId(principal.id());

        Review saved = reviewRepository.save(review);

        auditService.record(principal.id(), null, SecurityEventType.REVIEW_RESPONSE_CREATED, ipAddress, "SUCCESS");

        return toReviewResponse(saved);
    }

    public ReviewResponse updateResponse(StaffPrincipal principal, Long reviewId, ManagementReviewResponseRequest request, String ipAddress) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with ID: " + reviewId));
        verifyStaffPropertyScope(principal, review.getHotel().getId());

        if (review.getManagementResponse() == null) {
            throw new ConflictException("No existing response to update. Create a response first.");
        }

        review.setManagementResponse(request.responseText().trim());
        if (request.responseRole() != null && !request.responseRole().isBlank()) {
            review.setResponseRole(request.responseRole().trim());
        }
        review.setResponseUpdatedAt(Instant.now());

        Review saved = reviewRepository.save(review);

        auditService.record(principal.id(), null, SecurityEventType.REVIEW_RESPONSE_UPDATED, ipAddress, "SUCCESS");

        return toReviewResponse(saved);
    }

    public void removeResponse(StaffPrincipal principal, Long reviewId, String ipAddress) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found with ID: " + reviewId));
        verifyStaffPropertyScope(principal, review.getHotel().getId());

        review.setManagementResponse(null);
        review.setResponseCreatedAt(null);
        review.setResponseUpdatedAt(null);
        review.setResponseByStaffId(null);
        review.setResponseRole(null);

        reviewRepository.save(review);

        auditService.record(principal.id(), null, SecurityEventType.REVIEW_RESPONSE_REMOVED, ipAddress, "SUCCESS");
    }

    // =========================================================================
    // Public Review Operations
    // =========================================================================

    @Transactional(readOnly = true)
    public List<PublicReviewResponse> getPublicHotelReviews(Long hotelId) {
        return reviewRepository.findByHotelIdAndStatusOrderByCreatedAtDesc(hotelId, ReviewStatus.ACTIVE)
                .stream()
                .map(this::toPublicReviewResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PublicReviewResponse> getPublicReviews(Long hotelId, Integer rating, String sort) {
        List<Review> reviews;
        if (hotelId != null) {
            reviews = reviewRepository.findByHotelIdAndStatusOrderByCreatedAtDesc(hotelId, ReviewStatus.ACTIVE);
        } else {
            reviews = reviewRepository.findAllByOrderByCreatedAtDesc()
                    .stream()
                    .filter(r -> r.getStatus() == ReviewStatus.ACTIVE)
                    .toList();
        }

        List<PublicReviewResponse> result = reviews.stream()
                .filter(r -> rating == null || r.getOverallRating() == rating)
                .map(this::toPublicReviewResponse)
                .toList();

        if ("HIGHEST".equalsIgnoreCase(sort)) {
            return result.stream().sorted((a, b) -> Integer.compare(b.overallRating(), a.overallRating())).toList();
        } else if ("LOWEST".equalsIgnoreCase(sort)) {
            return result.stream().sorted(Comparator.comparingInt(PublicReviewResponse::overallRating)).toList();
        }
        return result;
    }

    @Transactional(readOnly = true)
    public HotelRatingSummaryResponse getHotelRatingSummary(Long hotelId) {
        Double avg = reviewRepository.findAverageRatingByHotelIdAndStatus(hotelId, ReviewStatus.ACTIVE);
        long totalCount = reviewRepository.countByHotelIdAndStatus(hotelId, ReviewStatus.ACTIVE);

        Double roundedAvg = (avg != null && totalCount > 0)
                ? Math.round(avg * 10.0) / 10.0
                : null;

        // Distribution
        Map<Integer, Long> distributionMap = new HashMap<>();
        for (int i = 1; i <= 5; i++) distributionMap.put(i, 0L);

        List<Object[]> rawDistribution = reviewRepository.findRatingDistributionByHotelIdAndStatus(hotelId, ReviewStatus.ACTIVE);
        for (Object[] row : rawDistribution) {
            int r = ((Number) row[0]).intValue();
            long c = ((Number) row[1]).longValue();
            distributionMap.put(r, c);
        }

        List<HotelRatingSummaryResponse.RatingDistributionItem> distribution = new ArrayList<>();
        for (int star = 5; star >= 1; star--) {
            long count = distributionMap.get(star);
            double pct = totalCount > 0 ? (double) count / totalCount * 100.0 : 0.0;
            distribution.add(new HotelRatingSummaryResponse.RatingDistributionItem(star, count, Math.round(pct * 10.0) / 10.0));
        }

        // Category Averages
        Map<String, Double> categoryAverages = new LinkedHashMap<>();
        List<Object[]> catRows = reviewRepository.findCategoryAveragesByHotelIdAndStatus(hotelId, ReviewStatus.ACTIVE);
        if (catRows != null && !catRows.isEmpty() && catRows.get(0) != null) {
            Object[] row = catRows.get(0);
            String[] keys = {"cleanliness", "comfort", "staffService", "facilities", "location", "value"};
            for (int i = 0; i < keys.length; i++) {
                if (row[i] != null) {
                    double val = ((Number) row[i]).doubleValue();
                    categoryAverages.put(keys[i], Math.round(val * 10.0) / 10.0);
                }
            }
        }

        return new HotelRatingSummaryResponse(hotelId, roundedAvg, totalCount, distribution, categoryAverages);
    }

    // =========================================================================
    // Helpers & Mappers
    // =========================================================================

    public void syncHotelRating(Long hotelId) {
        Double avg = reviewRepository.findAverageRatingByHotelIdAndStatus(hotelId, ReviewStatus.ACTIVE);
        long count = reviewRepository.countByHotelIdAndStatus(hotelId, ReviewStatus.ACTIVE);

        hotelRepository.findById(hotelId).ifPresent(hotel -> {
            hotel.setRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
            hotel.setReviewCount((int) count);
            hotelRepository.save(hotel);
        });
    }

    private boolean isCompletedStay(Reservation reservation) {
        return reservation.getReservationStatus() == ReservationStatus.COMPLETED
                && reservation.getCheckOut() != null
                && !reservation.getCheckOut().isAfter(LocalDate.now());
    }

    private void verifyStaffPropertyScope(StaffPrincipal principal, Long hotelId) {
        if (principal == null) {
            throw new AccessDeniedException("Authentication required.");
        }
        if (StaffRole.MANAGER.name().equals(principal.role())) {
            return;
        }
        if (StaffRole.HOTEL_STAFF.name().equals(principal.role())) {
            if (principal.assignedHotelId() == null || !principal.assignedHotelId().equals(hotelId)) {
                throw new AccessDeniedException("Staff cannot moderate reviews belonging to another hotel.");
            }
            return;
        }
        throw new AccessDeniedException("You do not have permission to moderate guest reviews.");
    }

    private Long resolveManagementHotelScope(StaffPrincipal principal, Long requestedHotelId) {
        if (principal == null) {
            throw new AccessDeniedException("Authentication required.");
        }
        if (StaffRole.MANAGER.name().equals(principal.role())) {
            return requestedHotelId;
        }
        if (StaffRole.HOTEL_STAFF.name().equals(principal.role())) {
            if (requestedHotelId != null && !requestedHotelId.equals(principal.assignedHotelId())) {
                throw new AccessDeniedException("Staff cannot access reviews for another hotel.");
            }
            return principal.assignedHotelId();
        }
        throw new AccessDeniedException("Access denied to review management.");
    }

    private ReviewResponse toReviewResponse(Review review) {
        String customerName = "LankaStay Guest";
        if (review.getCustomer() != null) {
            customerName = review.getCustomer().getFirstName() + " " + review.getCustomer().getLastName();
        }

        String roomName = "Standard Room";
        if (review.getReservation() != null) {
            List<ReservationItem> items = reservationItemRepository.findByReservationId(review.getReservation().getId());
            if (!items.isEmpty() && items.get(0).getRoomNameSnapshot() != null) {
                roomName = items.get(0).getRoomNameSnapshot();
            }
        }

        ManagementResponseDTO mgmtResp = null;
        if (review.getManagementResponse() != null) {
            mgmtResp = new ManagementResponseDTO(
                    review.getManagementResponse(),
                    review.getResponseRole(),
                    review.getResponseCreatedAt(),
                    review.getResponseUpdatedAt()
            );
        }

        return new ReviewResponse(
                review.getId(),
                review.getCustomer() != null ? review.getCustomer().getId() : null,
                customerName,
                review.getHotel().getId(),
                review.getHotel().getName(),
                review.getReservation() != null ? review.getReservation().getId() : null,
                review.getReservation() != null ? review.getReservation().getReservationCode() : null,
                review.getReservation() != null && review.getReservation().getCheckIn() != null
                        ? review.getReservation().getCheckIn().toString() : null,
                review.getReservation() != null && review.getReservation().getCheckOut() != null
                        ? review.getReservation().getCheckOut().toString() : null,
                roomName,
                review.getOverallRating(),
                review.getCleanlinessRating(),
                review.getComfortRating(),
                review.getStaffServiceRating(),
                review.getFacilitiesRating(),
                review.getLocationRating(),
                review.getValueForMoneyRating(),
                review.getTitle(),
                review.getComment(),
                review.getPhotos(),
                review.getStatus(),
                true, // Always verified stay because enforced by reservation
                review.getCustomerUpdatedAt(),
                review.getDeletedAt(),
                review.getModerationReason(),
                review.getModerationNote(),
                review.getHiddenAt(),
                review.getHiddenByStaffId(),
                mgmtResp,
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }

    private PublicReviewResponse toPublicReviewResponse(Review review) {
        String reviewerName = "LankaStay Guest";
        if (review.getCustomer() != null) {
            String first = review.getCustomer().getFirstName();
            String last = review.getCustomer().getLastName();
            if (first != null && !first.isBlank()) {
                reviewerName = first + (last != null && !last.isBlank() ? " " + last.charAt(0) + "." : "");
            }
        }

        String stayMonth = "Stayed recently";
        if (review.getReservation() != null && review.getReservation().getCheckOut() != null) {
            stayMonth = "Stayed " + MONTH_YEAR_FORMATTER.format(review.getReservation().getCheckOut().atStartOfDay(ZoneId.of("UTC")));
        }

        String roomName = null;
        if (review.getReservation() != null) {
            List<ReservationItem> items = reservationItemRepository.findByReservationId(review.getReservation().getId());
            if (!items.isEmpty() && items.get(0).getRoomNameSnapshot() != null) {
                roomName = items.get(0).getRoomNameSnapshot();
            }
        }

        ManagementResponseDTO mgmtResp = null;
        if (review.getManagementResponse() != null) {
            mgmtResp = new ManagementResponseDTO(
                    review.getManagementResponse(),
                    review.getResponseRole(),
                    review.getResponseCreatedAt(),
                    review.getResponseUpdatedAt()
            );
        }

        return new PublicReviewResponse(
                review.getId(),
                review.getHotel().getId(),
                review.getHotel().getName(),
                review.getOverallRating(),
                review.getCleanlinessRating(),
                review.getComfortRating(),
                review.getStaffServiceRating(),
                review.getFacilitiesRating(),
                review.getLocationRating(),
                review.getValueForMoneyRating(),
                review.getTitle(),
                review.getComment(),
                review.getPhotos(),
                reviewerName,
                true, // Verified stay
                stayMonth,
                roomName,
                mgmtResp,
                review.getCreatedAt(),
                review.getCustomerUpdatedAt()
        );
    }
}
