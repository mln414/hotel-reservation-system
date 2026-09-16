// SE2030 LankaStay - Customer Review Management and Moderation
package com.lankastay.backend.controller;

import com.lankastay.backend.dto.review.CreateReviewRequest;
import com.lankastay.backend.dto.review.ReviewResponse;
import com.lankastay.backend.dto.review.ReviewSummaryResponse;
import com.lankastay.backend.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public/reviews")
public class CustomerReviewController {

    private final ReviewService reviewService;

    public CustomerReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> submitReview(@Valid @RequestBody CreateReviewRequest request,
                                                       jakarta.servlet.http.HttpServletRequest servletRequest) {
        jakarta.servlet.http.HttpSession session = servletRequest.getSession(false);
        java.util.UUID customerId = null;
        if (session != null && session.getAttribute("LANKASTAY_CUSTOMER_USER") != null) {
            try {
                customerId = java.util.UUID.fromString((String) session.getAttribute("LANKASTAY_CUSTOMER_USER"));
            } catch (Exception ignored) {}
        }
        ReviewResponse response = reviewService.submitReview(request, customerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/hotel/{hotelId}")
    public ResponseEntity<List<ReviewResponse>> getHotelReviews(@PathVariable Long hotelId) {
        List<ReviewResponse> list = reviewService.getApprovedReviewsForHotel(hotelId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/hotel/{hotelId}/summary")
    public ResponseEntity<ReviewSummaryResponse> getHotelReviewSummary(@PathVariable Long hotelId) {
        ReviewSummaryResponse summary = reviewService.getHotelReviewSummary(hotelId);
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/{id}/helpful")
    public ResponseEntity<Map<String, String>> markHelpful(@PathVariable Long id) {
        reviewService.incrementHelpfulCount(id);
        return ResponseEntity.ok(Map.of("message", "Review marked as helpful"));
    }
}
