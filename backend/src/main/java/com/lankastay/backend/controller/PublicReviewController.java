package com.lankastay.backend.controller;

import com.lankastay.backend.dto.review.HotelRatingSummaryResponse;
import com.lankastay.backend.dto.review.PublicReviewResponse;
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
    public ResponseEntity<List<PublicReviewResponse>> getHotelReviews(@PathVariable Long hotelId) {
        return ResponseEntity.ok(reviewService.getPublicHotelReviews(hotelId));
    }

    @GetMapping("/hotels/{hotelId}/ratings")
    public ResponseEntity<HotelRatingSummaryResponse> getHotelRatingSummary(@PathVariable Long hotelId) {
        return ResponseEntity.ok(reviewService.getHotelRatingSummary(hotelId));
    }

    @GetMapping("/reviews")
    public ResponseEntity<List<PublicReviewResponse>> getPublicReviews(
            @RequestParam(required = false) Long hotelId,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) String sort) {
        return ResponseEntity.ok(reviewService.getPublicReviews(hotelId, rating, sort));
    }
}
