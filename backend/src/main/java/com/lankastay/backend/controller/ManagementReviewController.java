package com.lankastay.backend.controller;

import com.lankastay.backend.dto.review.HideReviewRequest;
import com.lankastay.backend.dto.review.ManagementReviewResponseRequest;
import com.lankastay.backend.dto.review.ReviewResponse;
import com.lankastay.backend.entity.ReviewStatus;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.ReviewService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/management/reviews")
@PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF')")
public class ManagementReviewController {

    private final ReviewService reviewService;

    public ManagementReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> listReviews(
            @AuthenticationPrincipal StaffPrincipal principal,
            @RequestParam(required = false) Long hotelId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) ReviewStatus status) {
        return ResponseEntity.ok(reviewService.getManagementReviews(principal, hotelId, search, rating, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReviewResponse> getReview(
            @PathVariable Long id,
            @AuthenticationPrincipal StaffPrincipal principal) {
        return ResponseEntity.ok(reviewService.getManagementReviewById(principal, id));
    }

    @PatchMapping("/{id}/hide")
    public ResponseEntity<ReviewResponse> hideReview(
            @PathVariable Long id,
            @Valid @RequestBody HideReviewRequest request,
            @AuthenticationPrincipal StaffPrincipal principal,
            HttpServletRequest servletRequest) {
        return ResponseEntity.ok(reviewService.hideReview(principal, id, request, clientIp(servletRequest)));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<ReviewResponse> restoreReview(
            @PathVariable Long id,
            @AuthenticationPrincipal StaffPrincipal principal,
            HttpServletRequest servletRequest) {
        return ResponseEntity.ok(reviewService.restoreReview(principal, id, clientIp(servletRequest)));
    }

    @PostMapping("/{id}/response")
    public ResponseEntity<ReviewResponse> addResponse(
            @PathVariable Long id,
            @Valid @RequestBody ManagementReviewResponseRequest request,
            @AuthenticationPrincipal StaffPrincipal principal,
            HttpServletRequest servletRequest) {
        return ResponseEntity.ok(reviewService.addResponse(principal, id, request, clientIp(servletRequest)));
    }

    @PutMapping("/{id}/response")
    public ResponseEntity<ReviewResponse> updateResponse(
            @PathVariable Long id,
            @Valid @RequestBody ManagementReviewResponseRequest request,
            @AuthenticationPrincipal StaffPrincipal principal,
            HttpServletRequest servletRequest) {
        return ResponseEntity.ok(reviewService.updateResponse(principal, id, request, clientIp(servletRequest)));
    }

    @DeleteMapping("/{id}/response")
    public ResponseEntity<Void> removeResponse(
            @PathVariable Long id,
            @AuthenticationPrincipal StaffPrincipal principal,
            HttpServletRequest servletRequest) {
        reviewService.removeResponse(principal, id, clientIp(servletRequest));
        return ResponseEntity.noContent().build();
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return (forwarded != null && !forwarded.isBlank()) ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
    }
}
