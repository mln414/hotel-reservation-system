package com.lankastay.backend;

import com.lankastay.backend.dto.review.*;
import com.lankastay.backend.entity.*;
import com.lankastay.backend.repository.*;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.CustomerSessionService;
import com.lankastay.backend.service.ReviewService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ReviewManagementIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ReviewRepository reviewRepository;
    @Autowired ReservationRepository reservationRepository;
    @Autowired ReservationItemRepository reservationItemRepository;
    @Autowired HotelRepository hotelRepository;
    @Autowired DestinationRepository destinationRepository;
    @Autowired CustomerUserRepository customerUserRepository;
    @Autowired StaffUserRepository staffUserRepository;
    @Autowired ReviewService reviewService;
    @Autowired JdbcTemplate jdbcTemplate;

    private final JsonMapper jsonMapper = JsonMapper.builder().build();

    private Hotel hotelA;
    private Hotel hotelB;
    private CustomerUser customerA;
    private CustomerUser customerB;
    private StaffPrincipal manager;
    private StaffPrincipal staffA;
    private StaffPrincipal staffB;
    private StaffPrincipal receptionistA;

    private Hotel createHotel(String name, Long destinationId, String city) {
        Hotel h = new Hotel();
        h.setName(name);
        h.setSlug(name.toLowerCase().replace(' ', '-') + "-" + UUID.randomUUID().toString().substring(0, 8));
        h.setPropertyType("RESORT");
        h.setDestinationId(destinationId);
        h.setCity(city);
        h.setAddress("10 Ocean Road");
        h.setPostalCode("80000");
        h.setStatus("ACTIVE");
        h.setSetupStatus("COMPLETE");
        h.setPublicationStatus("ACTIVE");
        h.setPrice(BigDecimal.valueOf(15000));
        h.setRating(0.0);
        h.setReviewCount(0);
        return hotelRepository.save(h);
    }

    @BeforeEach
    void setUp() {
        reviewRepository.deleteAll();

        hotelA = createHotel("Grand Galle Bay", 1L, "Galle");
        hotelB = createHotel("Kandy Lakeside", 1L, "Kandy");

        CustomerUser cA = new CustomerUser();
        cA.setEmail("customerA_" + System.nanoTime() + "@lankastay.test");
        cA.setPasswordHash("$2a$10$hashed");
        cA.setFirstName("Kasun");
        cA.setLastName("Perera");
        cA.setPhone("+94771234567");
        cA.setStatus("ACTIVE");
        customerA = customerUserRepository.save(cA);

        CustomerUser cB = new CustomerUser();
        cB.setEmail("customerB_" + System.nanoTime() + "@lankastay.test");
        cB.setPasswordHash("$2a$10$hashed");
        cB.setFirstName("Amara");
        cB.setLastName("Silva");
        cB.setPhone("+94779876543");
        cB.setStatus("ACTIVE");
        customerB = customerUserRepository.save(cB);

        manager = createStaff("manager_" + System.nanoTime() + "@lankastay.lk", StaffRole.MANAGER, null);
        staffA = createStaff("staffA_" + System.nanoTime() + "@lankastay.lk", StaffRole.HOTEL_STAFF, hotelA.getId());
        staffB = createStaff("staffB_" + System.nanoTime() + "@lankastay.lk", StaffRole.HOTEL_STAFF, hotelB.getId());
        receptionistA = createStaff("recA_" + System.nanoTime() + "@lankastay.lk", StaffRole.RECEPTIONIST, hotelA.getId());
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        reviewRepository.deleteAll();
    }

    private StaffPrincipal createStaff(String email, StaffRole role, Long assignedHotelId) {
        StaffUser user = new StaffUser();
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(role);
        user.setStatus(StaffStatus.ACTIVE);
        user.setAssignedHotelId(assignedHotelId);
        user.setMustChangePassword(false);
        user.setPasswordHash("hashed_password");
        StaffUser saved = staffUserRepository.saveAndFlush(user);
        return StaffPrincipal.from(saved);
    }

    private Reservation createReservation(CustomerUser customer, Hotel hotel, ReservationStatus status) {
        Reservation res = new Reservation();
        res.setReservationCode("RES-" + System.nanoTime());
        res.setHotelId(hotel.getId());
        res.setCustomerId(customer.getId());
        res.setGuestName(customer.getFirstName() + " " + customer.getLastName());
        res.setGuestEmail(customer.getEmail());
        res.setGuestPhone(customer.getPhone());
        res.setCheckIn(LocalDate.now().minusDays(5));
        res.setCheckOut(LocalDate.now().minusDays(2));
        res.setNumberOfNights(3);
        res.setAdults(2);
        res.setChildren(0);
        res.setSubtotalAmount(new BigDecimal("30000.00"));
        res.setTotalAmount(new BigDecimal("33000.00"));
        res.setNetAmount(new BigDecimal("33000.00"));
        res.setReservationStatus(status);
        res.setPaymentStatus(PaymentStatus.PAID);
        res.setAssignmentState(AssignmentState.ASSIGNED);
        res = reservationRepository.save(res);

        ReservationItem item = new ReservationItem();
        item.setReservationId(res.getId());
        item.setRoomId(101L);
        item.setRoomRateId(201L);
        item.setQuantity(1);
        item.setNightlyRate(new BigDecimal("10000.00"));
        item.setTotalPrice(new BigDecimal("30000.00"));
        item.setRoomNameSnapshot("Ocean Deluxe Suite");
        reservationItemRepository.save(item);

        return res;
    }

    private MockHttpSession customerSession(CustomerUser customer) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(CustomerSessionService.CUSTOMER_SESSION_KEY, customer.getId().toString());
        return session;
    }

    @Test
    void customerCanCreateReviewForCompletedReservation_andPersistsInDb() throws Exception {
        Reservation res = createReservation(customerA, hotelA, ReservationStatus.COMPLETED);

        CreateReviewRequest request = new CreateReviewRequest(
                res.getId(),
                5,
                5, 5, 5, 4, 5, 4,
                "Spectacular seaside retreat",
                "We had an incredible experience here. The ocean views were breathtaking and the staff was so polite.",
                List.of("/uploads/photo1.jpg")
        );

        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.overallRating").value(5))
                .andExpect(jsonPath("$.title").value("Spectacular seaside retreat"))
                .andExpect(jsonPath("$.verifiedStay").value(true))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        assertThat(reviewRepository.count()).isEqualTo(1);
        Review inDb = reviewRepository.findByReservationId(res.getId()).orElseThrow();
        assertThat(inDb.getOverallRating()).isEqualTo(5);
        assertThat(inDb.getHotel().getId()).isEqualTo(hotelA.getId());
        assertThat(inDb.getCustomer().getId()).isEqualTo(customerA.getId());
        assertThat(inDb.getStatus()).isEqualTo(ReviewStatus.ACTIVE);

        // Hotel rating aggregate check
        Hotel updatedHotel = hotelRepository.findById(hotelA.getId()).orElseThrow();
        assertThat(updatedHotel.getRating()).isEqualTo(5.0);
        assertThat(updatedHotel.getReviewCount()).isEqualTo(1);
    }

    @Test
    void cannotReviewUncompletedOrCancelledReservation() throws Exception {
        Reservation confirmedRes = createReservation(customerA, hotelA, ReservationStatus.CONFIRMED);
        Reservation cancelledRes = createReservation(customerA, hotelA, ReservationStatus.CANCELLED);

        CreateReviewRequest reqConfirmed = new CreateReviewRequest(
                confirmedRes.getId(), 5, null, null, null, null, null, null,
                "Early review", "Trying to review before checkout", null
        );

        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(reqConfirmed)))
                .andExpect(status().isConflict());

        CreateReviewRequest reqCancelled = new CreateReviewRequest(
                cancelledRes.getId(), 5, null, null, null, null, null, null,
                "Cancelled review", "Trying to review cancelled booking", null
        );

        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(reqCancelled)))
                .andExpect(status().isConflict());
    }

    @Test
    void cannotReviewOtherCustomersReservation() throws Exception {
        Reservation resCustomerA = createReservation(customerA, hotelA, ReservationStatus.COMPLETED);

        CreateReviewRequest req = new CreateReviewRequest(
                resCustomerA.getId(), 5, null, null, null, null, null, null,
                "Hijack review", "Customer B trying to review Customer A stay", null
        );

        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerB))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void cannotSubmitDuplicateReviewForSameReservation() throws Exception {
        Reservation res = createReservation(customerA, hotelA, ReservationStatus.COMPLETED);

        CreateReviewRequest req1 = new CreateReviewRequest(
                res.getId(), 5, null, null, null, null, null, null,
                "First review", "First submission for this completed stay", null
        );

        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        CreateReviewRequest req2 = new CreateReviewRequest(
                res.getId(), 4, null, null, null, null, null, null,
                "Second review", "Second duplicate submission for same stay", null
        );

        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(req2)))
                .andExpect(status().isConflict());

        assertThat(reviewRepository.count()).isEqualTo(1);
    }

    @Test
    void ratingBoundsValidationRejectsInvalidRatings() throws Exception {
        Reservation res = createReservation(customerA, hotelA, ReservationStatus.COMPLETED);

        // rating 0 -> 400
        CreateReviewRequest reqZero = new CreateReviewRequest(
                res.getId(), 0, null, null, null, null, null, null,
                "Zero rating", "Invalid zero rating test submission", null
        );
        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(reqZero)))
                .andExpect(status().isBadRequest());

        // rating 6 -> 400
        CreateReviewRequest reqSix = new CreateReviewRequest(
                res.getId(), 6, null, null, null, null, null, null,
                "Six rating", "Invalid six rating test submission", null
        );
        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(reqSix)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void customerCanEditOwnReview_andRatingRecalculates() throws Exception {
        Reservation res = createReservation(customerA, hotelA, ReservationStatus.COMPLETED);

        CreateReviewRequest createReq = new CreateReviewRequest(
                res.getId(), 4, null, null, null, null, null, null,
                "Good stay", "Initial 4 star review submitted here", null
        );
        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated());

        Review review = reviewRepository.findByReservationId(res.getId()).orElseThrow();

        // Customer edits from 4 to 5 stars
        UpdateReviewRequest updateReq = new UpdateReviewRequest(
                5, 5, 5, 5, 5, 5, 5,
                "Upgraded to excellent stay",
                "After thinking it through, the breakfast was so exceptional that I am giving 5 stars.",
                null
        );

        mvc.perform(put("/api/v1/customer/reviews/" + review.getId())
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overallRating").value(5))
                .andExpect(jsonPath("$.title").value("Upgraded to excellent stay"));

        Review updated = reviewRepository.findById(review.getId()).orElseThrow();
        assertThat(updated.getOverallRating()).isEqualTo(5);

        Hotel updatedHotel = hotelRepository.findById(hotelA.getId()).orElseThrow();
        assertThat(updatedHotel.getRating()).isEqualTo(5.0);
    }

    @Test
    void customerCannotEditOtherCustomersReview() throws Exception {
        Reservation res = createReservation(customerA, hotelA, ReservationStatus.COMPLETED);

        CreateReviewRequest createReq = new CreateReviewRequest(
                res.getId(), 4, null, null, null, null, null, null,
                "Good stay", "Customer A's initial review submitted here", null
        );
        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated());

        Review review = reviewRepository.findByReservationId(res.getId()).orElseThrow();

        UpdateReviewRequest updateReq = new UpdateReviewRequest(
                1, null, null, null, null, null, null,
                "Hacked review", "Customer B tampering with Customer A review", null
        );

        mvc.perform(put("/api/v1/customer/reviews/" + review.getId())
                        .session(customerSession(customerB))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    void customerCanPermanentlyDeleteOwnReview_andItIsRemovedFromEverySurfaceAndRating() throws Exception {
        Reservation res = createReservation(customerA, hotelA, ReservationStatus.COMPLETED);

        CreateReviewRequest createReq = new CreateReviewRequest(
                res.getId(), 5, null, null, null, null, null, null,
                "Amazing stay", "Review to be permanently deleted by customer", List.of("/uploads/review-delete-test.jpg")
        );
        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated());

        Review review = reviewRepository.findByReservationId(res.getId()).orElseThrow();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM review_photos WHERE review_id = ?", Integer.class, review.getId()
        )).isEqualTo(1);

        // Customer permanently deletes review
        mvc.perform(delete("/api/v1/customer/reviews/" + review.getId())
                        .session(customerSession(customerA))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        assertThat(reviewRepository.findById(review.getId())).isEmpty();
        assertThat(reviewRepository.findByReservationId(res.getId())).isEmpty();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM review_photos WHERE review_id = ?", Integer.class, review.getId()
        )).isZero();

        // Public API must exclude it
        mvc.perform(get("/api/public/hotels/" + hotelA.getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // Customer profile API must no longer return it either
        mvc.perform(get("/api/v1/customer/reviews")
                        .session(customerSession(customerA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // A hard-deleted review must allow the same completed stay to be reviewed again.
        assertThat(reservationRepository.findById(res.getId()).orElseThrow().getReviewSubmittedAt()).isNull();
        assertThat(hotelRepository.findById(hotelA.getId()).orElseThrow().getReviewCount()).isZero();
        mvc.perform(get("/api/v1/customer/reviews/eligible-stays")
                        .session(customerSession(customerA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].eligible").value(true))
                .andExpect(jsonPath("$[0].alreadyReviewed").value(false));

        // Legacy historical markers must not block a stay with no review row.
        Reservation legacyReservation = reservationRepository.findById(res.getId()).orElseThrow();
        legacyReservation.setReviewSubmittedAt(java.time.LocalDateTime.now().minusDays(1));
        reservationRepository.save(legacyReservation);
        MvcResult recreated = mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();
        Long recreatedReviewId = jsonMapper.readTree(recreated.getResponse().getContentAsString()).get("id").asLong();
        assertThat(recreatedReviewId).isNotEqualTo(review.getId());
        assertThat(reviewRepository.findByReservationId(res.getId())).get().extracting(Review::getId)
                .isEqualTo(recreatedReviewId);
        mvc.perform(get("/api/v1/customer/reviews/eligible-stays")
                        .session(customerSession(customerA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].eligible").value(false))
                .andExpect(jsonPath("$[0].alreadyReviewed").value(true));

        // The recreated review is now the only public rating.
        Hotel updatedHotel = hotelRepository.findById(hotelA.getId()).orElseThrow();
        assertThat(updatedHotel.getReviewCount()).isEqualTo(1);
        assertThat(updatedHotel.getRating()).isEqualTo(5.0);
        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(createReq)))
                .andExpect(status().isConflict());
    }

    @Test
    void managerCanHideAndRestoreReview() throws Exception {
        Reservation res = createReservation(customerA, hotelA, ReservationStatus.COMPLETED);

        CreateReviewRequest createReq = new CreateReviewRequest(
                res.getId(), 3, null, null, null, null, null, null,
                "Average stay", "Review that will be moderated by manager", null
        );
        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated());

        Review review = reviewRepository.findByReservationId(res.getId()).orElseThrow();

        // Manager hides review
        HideReviewRequest hideReq = new HideReviewRequest("INAPPROPRIATE_LANGUAGE", "Contains terms violating content policy");
        mvc.perform(patch("/api/v1/management/reviews/" + review.getId() + "/hide")
                        .with(user(manager))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(hideReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("HIDDEN_BY_MODERATION"));

        Review hiddenDb = reviewRepository.findById(review.getId()).orElseThrow();
        assertThat(hiddenDb.getStatus()).isEqualTo(ReviewStatus.HIDDEN_BY_MODERATION);

        // Public excludes it
        mvc.perform(get("/api/public/hotels/" + hotelA.getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // Manager restores review
        mvc.perform(patch("/api/v1/management/reviews/" + review.getId() + "/restore")
                        .with(user(manager))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        Review restoredDb = reviewRepository.findById(review.getId()).orElseThrow();
        assertThat(restoredDb.getStatus()).isEqualTo(ReviewStatus.ACTIVE);

        // Public includes it again
        mvc.perform(get("/api/public/hotels/" + hotelA.getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void permanentlyDeletedReviewCannotBeRestoredByManagement() throws Exception {
        Reservation res = createReservation(customerA, hotelA, ReservationStatus.COMPLETED);

        CreateReviewRequest createReq = new CreateReviewRequest(
                res.getId(), 4, null, null, null, null, null, null,
                "Stay review", "Review to be customer deleted then manager attempted restore", null
        );
        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated());

        Review review = reviewRepository.findByReservationId(res.getId()).orElseThrow();

        // Customer deletes it
        mvc.perform(delete("/api/v1/customer/reviews/" + review.getId())
                        .session(customerSession(customerA))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        assertThat(reviewRepository.findById(review.getId())).isEmpty();

        // There is no review record left for management to restore.
        mvc.perform(patch("/api/v1/management/reviews/" + review.getId() + "/restore")
                        .with(user(manager))
                        .with(csrf()))
                .andExpect(status().isNotFound());
    }

    @Test
    void customerCannotDeleteAnotherCustomersReview() throws Exception {
        Reservation res = createReservation(customerA, hotelA, ReservationStatus.COMPLETED);
        CreateReviewRequest request = new CreateReviewRequest(
                res.getId(), 4, null, null, null, null, null, null,
                "Owner protected review", "Only the customer who wrote this review may delete it.", null
        );
        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        Review review = reviewRepository.findByReservationId(res.getId()).orElseThrow();
        mvc.perform(delete("/api/v1/customer/reviews/" + review.getId())
                        .session(customerSession(customerB))
                        .with(csrf()))
                .andExpect(status().isForbidden());

        assertThat(reviewRepository.findById(review.getId())).isPresent();
    }

    @Test
    void futureCheckoutIsNotReviewEligibleEvenIfStatusWasMarkedCompleted() throws Exception {
        Reservation res = createReservation(customerA, hotelA, ReservationStatus.COMPLETED);
        res.setCheckIn(LocalDate.now().plusDays(2));
        res.setCheckOut(LocalDate.now().plusDays(5));
        reservationRepository.saveAndFlush(res);

        CreateReviewRequest request = new CreateReviewRequest(
                res.getId(), 5, null, null, null, null, null, null,
                "Future stay", "A future checkout cannot represent a genuinely completed stay.", null
        );
        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());

        mvc.perform(get("/api/v1/customer/reviews/eligible-stays")
                        .session(customerSession(customerA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].eligible").value(false));
    }

    @Test
    void hotelStaffPropertyScopeEnforced() throws Exception {
        Reservation resHotelA = createReservation(customerA, hotelA, ReservationStatus.COMPLETED);
        Reservation resHotelB = createReservation(customerB, hotelB, ReservationStatus.COMPLETED);

        CreateReviewRequest reqA = new CreateReviewRequest(
                resHotelA.getId(), 5, null, null, null, null, null, null,
                "Hotel A stay", "Review for hotel A in Galle", null
        );
        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(reqA)))
                .andExpect(status().isCreated());

        CreateReviewRequest reqB = new CreateReviewRequest(
                resHotelB.getId(), 4, null, null, null, null, null, null,
                "Hotel B stay", "Review for hotel B in Kandy", null
        );
        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerB))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(reqB)))
                .andExpect(status().isCreated());

        Review reviewHotelA = reviewRepository.findByReservationId(resHotelA.getId()).orElseThrow();
        Review reviewHotelB = reviewRepository.findByReservationId(resHotelB.getId()).orElseThrow();

        // staffA (Hotel A) moderates Hotel A review -> 200 OK
        HideReviewRequest hideReq = new HideReviewRequest("DISPUTED_FACTS", "Under staff review");
        mvc.perform(patch("/api/v1/management/reviews/" + reviewHotelA.getId() + "/hide")
                        .with(user(staffA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(hideReq)))
                .andExpect(status().isOk());

        // staffA (Hotel A) attempts to moderate Hotel B review -> 403 Forbidden
        mvc.perform(patch("/api/v1/management/reviews/" + reviewHotelB.getId() + "/hide")
                        .with(user(staffA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(hideReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    void receptionistDeniedModerationAccess() throws Exception {
        Reservation res = createReservation(customerA, hotelA, ReservationStatus.COMPLETED);

        CreateReviewRequest req = new CreateReviewRequest(
                res.getId(), 5, null, null, null, null, null, null,
                "Receptionist test", "Test to verify receptionist has no moderation rights", null
        );
        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        Review review = reviewRepository.findByReservationId(res.getId()).orElseThrow();

        HideReviewRequest hideReq = new HideReviewRequest("DISPUTED_FACTS", "Receptionist attempt");
        mvc.perform(patch("/api/v1/management/reviews/" + review.getId() + "/hide")
                        .with(user(receptionistA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(hideReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    void managementCanAddUpdateAndRemoveResponse() throws Exception {
        Reservation res = createReservation(customerA, hotelA, ReservationStatus.COMPLETED);

        CreateReviewRequest req = new CreateReviewRequest(
                res.getId(), 5, null, null, null, null, null, null,
                "Great experience", "Loved the breakfast and ocean view", null
        );
        mvc.perform(post("/api/v1/customer/reviews")
                        .session(customerSession(customerA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        Review review = reviewRepository.findByReservationId(res.getId()).orElseThrow();

        // 1. Add Response
        ManagementReviewResponseRequest addReq = new ManagementReviewResponseRequest(
                "Thank you Kasun for your wonderful feedback. We hope to welcome you again!",
                "General Manager"
        );
        mvc.perform(post("/api/v1/management/reviews/" + review.getId() + "/response")
                        .with(user(staffA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.managementResponse.responseText").value("Thank you Kasun for your wonderful feedback. We hope to welcome you again!"))
                .andExpect(jsonPath("$.managementResponse.respondedRole").value("General Manager"));

        // Public API displays response
        mvc.perform(get("/api/public/hotels/" + hotelA.getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].managementResponse.responseText").value("Thank you Kasun for your wonderful feedback. We hope to welcome you again!"));

        // 2. Update Response
        ManagementReviewResponseRequest updateReq = new ManagementReviewResponseRequest(
                "Updated: We look forward to seeing you again next year!",
                "Hotel Operations"
        );
        mvc.perform(put("/api/v1/management/reviews/" + review.getId() + "/response")
                        .with(user(staffA))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.managementResponse.responseText").value("Updated: We look forward to seeing you again next year!"));

        // 3. Remove Response
        mvc.perform(delete("/api/v1/management/reviews/" + review.getId() + "/response")
                        .with(user(staffA))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        Review afterRemove = reviewRepository.findById(review.getId()).orElseThrow();
        assertThat(afterRemove.getManagementResponse()).isNull();
    }
}
