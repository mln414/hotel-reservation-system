// SE2030 LankaStay - Customer Review Management and Moderation
package com.lankastay.backend.controller;

import com.lankastay.backend.dto.review.*;
import com.lankastay.backend.entity.ReviewStatus;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/management/reviews")
public class ManagementReviewController {

    private final ReviewService reviewService;

    public ManagementReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public ResponseEntity<List<ReviewResponse>> getReviews(
            @RequestParam(required = false) Long hotelId,
            @RequestParam(required = false) ReviewStatus status,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        List<ReviewResponse> list = reviewService.getManagementReviews(hotelId, status, minRating, search, principal);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public ResponseEntity<ReviewStatsResponse> getReviewStats(
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        ReviewStatsResponse stats = reviewService.getReviewStats(principal);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public ResponseEntity<ReviewResponse> getReviewById(
            @PathVariable Long id,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        ReviewResponse response = reviewService.getReviewById(id, principal);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public ResponseEntity<ReviewResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ReviewStatusUpdateRequest request,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        ReviewResponse response = reviewService.updateReviewStatus(id, request.status(), request.moderationNote(), principal);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/reply")
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
    public ResponseEntity<ReviewResponse> replyToReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewReplyRequest request,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        ReviewResponse response = reviewService.replyToReview(id, request.reply(), principal);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, String>> deleteReview(
            @PathVariable Long id,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        reviewService.deleteReview(id, principal);
        return ResponseEntity.ok(Map.of("message", "Review successfully deleted"));
    }
}
