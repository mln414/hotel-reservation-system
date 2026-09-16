package com.lankastay.backend.controller;

import com.lankastay.backend.dto.review.ReviewResponse;
import com.lankastay.backend.dto.review.ReviewSummaryResponse;
import com.lankastay.backend.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public")
public class PublicReviewController {

    private final ReviewService reviewService;

    public PublicReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/hotels/{hotelId}/reviews")
    public ResponseEntity<List<ReviewResponse>> getHotelReviews(@PathVariable Long hotelId) {
        return ResponseEntity.ok(reviewService.getApprovedReviewsForHotel(hotelId));
    }

    @GetMapping("/hotels/{hotelId}/ratings")
    public ResponseEntity<ReviewSummaryResponse> getHotelRatingSummary(@PathVariable Long hotelId) {
        return ResponseEntity.ok(reviewService.getHotelReviewSummary(hotelId));
    }

    @GetMapping("/reviews")
    public ResponseEntity<List<ReviewResponse>> getPublicReviews(
            @RequestParam(required = false) Long hotelId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String sort) {
        List<ReviewResponse> reviews = hotelId == null ? List.of() : reviewService.getApprovedReviewsForHotel(hotelId);
        if (rating != null) reviews = reviews.stream().filter(r -> r.rating() != null && r.rating().intValue() == rating).toList();
        return ResponseEntity.ok(reviews);
    }
}
