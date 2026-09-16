package com.lankastay.backend.controller;

import com.lankastay.backend.dto.review.CreateReviewRequest;
import com.lankastay.backend.dto.review.EligibleStayResponse;
import com.lankastay.backend.dto.review.ReviewResponse;
import com.lankastay.backend.dto.review.UpdateReviewRequest;
import com.lankastay.backend.entity.CustomerUser;
import com.lankastay.backend.service.CustomerSessionService;
import com.lankastay.backend.service.ReviewService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customer/reviews")
public class CustomerReviewController {

    private final ReviewService reviewService;
    private final CustomerSessionService customerSessionService;

    public CustomerReviewController(ReviewService reviewService, CustomerSessionService customerSessionService) {
        this.reviewService = reviewService;
        this.customerSessionService = customerSessionService;
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(@Valid @RequestBody CreateReviewRequest request,
                                                       HttpServletRequest servletRequest) {
        CustomerUser customer = customerSessionService.requireCustomer(servletRequest);
        ReviewResponse response = reviewService.createReview(customer, request, clientIp(servletRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReviewResponse> updateReview(@PathVariable Long id,
                                                       @Valid @RequestBody UpdateReviewRequest request,
                                                       HttpServletRequest servletRequest) {
        CustomerUser customer = customerSessionService.requireCustomer(servletRequest);
        ReviewResponse response = reviewService.updateReview(customer, id, request, clientIp(servletRequest));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id,
                                             HttpServletRequest servletRequest) {
        CustomerUser customer = customerSessionService.requireCustomer(servletRequest);
        reviewService.deleteCustomerReview(customer, id, clientIp(servletRequest));
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> getMyReviews(HttpServletRequest servletRequest) {
        CustomerUser customer = customerSessionService.requireCustomer(servletRequest);
        return ResponseEntity.ok(reviewService.getCustomerReviews(customer));
    }

    @GetMapping("/eligible-stays")
    public ResponseEntity<List<EligibleStayResponse>> getEligibleStays(HttpServletRequest servletRequest) {
        CustomerUser customer = customerSessionService.requireCustomer(servletRequest);
        return ResponseEntity.ok(reviewService.getEligibleStays(customer));
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return (forwarded != null && !forwarded.isBlank()) ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
    }
}
