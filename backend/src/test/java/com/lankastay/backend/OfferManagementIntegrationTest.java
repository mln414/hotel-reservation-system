package com.lankastay.backend;

import com.lankastay.backend.dto.offer.CreateOfferRequest;
import com.lankastay.backend.dto.offer.OfferStatusRequest;
import com.lankastay.backend.dto.offer.UpdateOfferRequest;
import com.lankastay.backend.entity.*;
import com.lankastay.backend.repository.*;
import com.lankastay.backend.security.StaffPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class OfferManagementIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private HotelRepository hotelRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private OfferRepository offerRepository;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private StaffUserRepository staffRepository;

    private MockMvc mvc;
    private final JsonMapper jsonMapper = JsonMapper.builder().build();

    private Hotel hotel1;
    private Hotel hotel2;
    private Room room1;
    private Room room2;
    private StaffPrincipal manager;
    private StaffPrincipal staffHotel1;
    private StaffPrincipal staffHotel2;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        hotel1 = createHotel("Offer Hotel 1");
        hotel2 = createHotel("Offer Hotel 2");

        room1 = roomRepository.save(new Room(hotel1.getId(), "Room 1", "room-1-" + UUID.randomUUID(), "STANDARD",
                "Desc", 2, 2, 0, 25.0, "King", 5, 20000.0, "ACTIVE", "/cover.png", "[]"));
        room2 = roomRepository.save(new Room(hotel2.getId(), "Room 2", "room-2-" + UUID.randomUUID(), "STANDARD",
                "Desc", 2, 2, 0, 25.0, "King", 5, 20000.0, "ACTIVE", "/cover.png", "[]"));

        manager = createStaff("mgr@test.com", StaffRole.MANAGER, null);
        staffHotel1 = createStaff("staff1@test.com", StaffRole.HOTEL_STAFF, hotel1.getId());
        staffHotel2 = createStaff("staff2@test.com", StaffRole.HOTEL_STAFF, hotel2.getId());
    }

    private Hotel createHotel(String name) {
        Hotel h = new Hotel();
        h.setName(name);
        h.setSlug(name.toLowerCase().replace(" ", "-") + "-" + UUID.randomUUID());
        h.setDestinationId(1L);
        h.setPropertyType("Hotel");
        h.setCategory("Luxury");
        h.setRating(4.5);
        h.setReviewCount(100);
        h.setPrice(BigDecimal.valueOf(30000));
        h.setStatus(HotelStatus.PUBLICATION_ACTIVE);
        h.setSetupStatus("COMPLETE");
        h.setPublicationStatus(HotelStatus.PUBLICATION_ACTIVE);
        h.setShortDescription("A beautiful hotel");
        return hotelRepository.save(h);
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
        StaffUser saved = staffRepository.save(user);
        return StaffPrincipal.from(saved);
    }

    @Test
    void managerCanCreateOfferSuccessfully() throws Exception {
        CreateOfferRequest req = new CreateOfferRequest(
                "Winter Wonderland Escape",
                "Escape to Sri Lanka this winter with 20% off.",
                "Full description of winter offer details and inclusions.",
                "PERCENTAGE",
                new BigDecimal("20.00"),
                "PER_STAY",
                LocalDate.now().plusDays(5),
                LocalDate.now().plusDays(60),
                LocalDate.now(),
                LocalDate.now().plusDays(30),
                2, 14,
                "MON,TUE,WED,THU,FRI,SAT,SUN",
                "ACTIVE",
                true,
                1,
                "/winter.jpg",
                List.of("Non-refundable", "Minimum 2 nights"),
                null,
                null,
                Set.of(hotel1.getId()),
                Set.of(room1.getId())
        );

        mvc.perform(post("/api/v1/management/offers")
                        .with(user(manager))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.slug").value("winter-wonderland-escape"))
                .andExpect(jsonPath("$.title").value("Winter Wonderland Escape"))
                .andExpect(jsonPath("$.discountType").value("PERCENTAGE"))
                .andExpect(jsonPath("$.discountValue").value(20.00))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.targetHotelIds", hasItem(hotel1.getId().intValue())));
    }

    @Test
    void offerCreationFailsOnInvalidValidation() throws Exception {
        // Percentage > 100%
        CreateOfferRequest excessiveDiscount = new CreateOfferRequest(
                "Invalid Discount Offer", "Short", "Full", "PERCENTAGE",
                new BigDecimal("150.00"), "PER_STAY",
                LocalDate.now().plusDays(5), LocalDate.now().plusDays(20),
                null, null, 1, null, null, "DRAFT", false, 0, null, null, null, null, null, null
        );

        mvc.perform(post("/api/v1/management/offers")
                        .with(user(manager))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(excessiveDiscount)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("cannot exceed 100%")));

        // stayEnd before stayStart
        CreateOfferRequest invertedDates = new CreateOfferRequest(
                "Inverted Dates", "Short", "Full", "FIXED_AMOUNT",
                new BigDecimal("5000.00"), "PER_STAY",
                LocalDate.now().plusDays(20), LocalDate.now().plusDays(5),
                null, null, 1, null, null, "DRAFT", false, 0, null, null, null, null, null, null
        );

        mvc.perform(post("/api/v1/management/offers")
                        .with(user(manager))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(invertedDates)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Stay end date cannot be before stay start date")));

        // Target room not belonging to target hotel
        CreateOfferRequest mismatchTargets = new CreateOfferRequest(
                "Mismatch Targets", "Short", "Full", "FIXED_AMOUNT",
                new BigDecimal("5000.00"), "PER_STAY",
                LocalDate.now().plusDays(5), LocalDate.now().plusDays(20),
                null, null, 1, null, null, "DRAFT", false, 0, null, null, null, null,
                Set.of(hotel1.getId()), Set.of(room2.getId()) // room2 belongs to hotel2
        );

        mvc.perform(post("/api/v1/management/offers")
                        .with(user(manager))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(mismatchTargets)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("which is not among the targeted hotels")));
    }

    @Test
    void staffCannotModifyOrDeleteOffersForOtherHotels() throws Exception {
        Offer offerHotel2 = new Offer();
        offerHotel2.setSlug("hotel2-offer");
        offerHotel2.setTitle("Hotel 2 Exclusive");
        offerHotel2.setShortDescription("Short");
        offerHotel2.setFullDescription("Full");
        offerHotel2.setDiscountType("PERCENTAGE");
        offerHotel2.setDiscountValue(new BigDecimal("10.00"));
        offerHotel2.setStayStartDate(LocalDate.now().plusDays(2));
        offerHotel2.setStayEndDate(LocalDate.now().plusDays(30));
        offerHotel2.setStatus("ACTIVE");
        offerHotel2.setTargetHotelIds(Set.of(hotel2.getId()));
        Offer savedOffer2 = offerRepository.save(offerHotel2);

        UpdateOfferRequest updateReq = new UpdateOfferRequest(
                "Staff Updated Hotel 2", "Short", "Full", "PERCENTAGE",
                new BigDecimal("15.00"), "PER_STAY",
                LocalDate.now().plusDays(2), LocalDate.now().plusDays(30),
                null, null, 1, null, null, false, 0, null, null, null, null,
                Set.of(hotel2.getId()), null
        );

        // staffHotel1 attempts to edit offerHotel2 -> 403 Forbidden
        mvc.perform(put("/api/v1/management/offers/" + savedOffer2.getId())
                        .with(user(staffHotel1))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());

        // staffHotel1 attempts to delete -> 403 Forbidden
        mvc.perform(delete("/api/v1/management/offers/" + savedOffer2.getId())
                        .with(user(staffHotel1))
                        .with(csrf()))
                .andExpect(status().isForbidden());

        // staffHotel1 attempts to change status -> 403 Forbidden
        mvc.perform(patch("/api/v1/management/offers/" + savedOffer2.getId() + "/status")
                        .with(user(staffHotel1))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(new OfferStatusRequest("INACTIVE"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCanToggleStatusAndSafeDeleteOffer() throws Exception {
        Offer offer = new Offer();
        offer.setSlug("temp-offer-to-delete");
        offer.setTitle("Temp Offer");
        offer.setShortDescription("Short");
        offer.setFullDescription("Full");
        offer.setDiscountType("FIXED_AMOUNT");
        offer.setDiscountValue(new BigDecimal("3000.00"));
        offer.setStayStartDate(LocalDate.now().plusDays(1));
        offer.setStayEndDate(LocalDate.now().plusDays(20));
        offer.setStatus("ACTIVE");
        Offer saved = offerRepository.save(offer);

        // Manager deactivates
        mvc.perform(patch("/api/v1/management/offers/" + saved.getId() + "/status")
                        .with(user(manager))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(new OfferStatusRequest("INACTIVE"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));

        // Manager deletes -> 204 No Content
        mvc.perform(delete("/api/v1/management/offers/" + saved.getId())
                        .with(user(manager))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        assertFalse(offerRepository.existsById(saved.getId()));
    }

    @Test
    void offerDeletionDetachesLiveReferenceAndPreservesReservationSnapshots() throws Exception {
        Offer offer = new Offer();
        offer.setSlug("referenced-offer");
        offer.setTitle("Referenced Offer");
        offer.setShortDescription("Short");
        offer.setFullDescription("Full");
        offer.setDiscountType("PERCENTAGE");
        offer.setDiscountValue(new BigDecimal("15.00"));
        offer.setStayStartDate(LocalDate.now().plusDays(1));
        offer.setStayEndDate(LocalDate.now().plusDays(20));
        offer.setStatus("ACTIVE");
        Offer savedOffer = offerRepository.save(offer);

        Reservation res = new Reservation();
        res.setReservationCode("LS-OFFER-REF");
        res.setHotelId(hotel1.getId());
        res.setCustomerId(UUID.randomUUID());
        res.setGuestName("Offer Guest");
        res.setGuestEmail("guest@offer.com");
        res.setCheckIn(LocalDate.now().plusDays(2));
        res.setCheckOut(LocalDate.now().plusDays(4));
        res.setNumberOfNights(2);
        res.setAdults(2);
        res.setChildren(0);
        res.setSubtotalAmount(new BigDecimal("40000.00"));
        res.setDiscountAmount(new BigDecimal("6000.00"));
        res.setTotalAmount(new BigDecimal("34000.00"));
        res.setNetAmount(new BigDecimal("34000.00"));
        res.setAppliedOfferId(savedOffer.getId());
        res.setOfferTitleSnapshot(savedOffer.getTitle());
        res.setDiscountTypeSnapshot("PERCENTAGE");
        res.setDiscountValueSnapshot(new BigDecimal("15.00"));
        res.setPaymentStatus(PaymentStatus.PENDING);
        res.setReservationStatus(ReservationStatus.CONFIRMED);
        res.setAssignmentState(AssignmentState.UNASSIGNED);
        reservationRepository.save(res);

        // Deletion removes only the nullable live offer reference. The saved
        // price and offer snapshots remain the historical source of truth.
        mvc.perform(delete("/api/v1/management/offers/" + savedOffer.getId())
                        .with(user(manager))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        assertFalse(offerRepository.existsById(savedOffer.getId()));
        Reservation preserved = reservationRepository.findById(res.getId()).orElseThrow();
        assertNull(preserved.getAppliedOfferId());
        assertEquals(new BigDecimal("40000.00"), preserved.getSubtotalAmount());
        assertEquals(new BigDecimal("6000.00"), preserved.getDiscountAmount());
        assertEquals(new BigDecimal("34000.00"), preserved.getTotalAmount());
        assertEquals("Referenced Offer", preserved.getOfferTitleSnapshot());
        assertEquals("PERCENTAGE", preserved.getDiscountTypeSnapshot());
        assertEquals(new BigDecimal("15.00"), preserved.getDiscountValueSnapshot());
    }

    @Test
    void publicOffersEndpointReturnsOnlyActiveValidOffers() throws Exception {
        Offer activeOffer = new Offer();
        activeOffer.setSlug("public-active");
        activeOffer.setTitle("Public Active");
        activeOffer.setShortDescription("Short");
        activeOffer.setFullDescription("Full");
        activeOffer.setDiscountType("PERCENTAGE");
        activeOffer.setDiscountValue(new BigDecimal("10.00"));
        activeOffer.setStayStartDate(LocalDate.now().minusDays(5));
        activeOffer.setStayEndDate(LocalDate.now().plusDays(30)); // Current
        activeOffer.setStatus("ACTIVE");
        activeOffer.setTargetHotelIds(Set.of(hotel1.getId()));
        offerRepository.save(activeOffer);

        Offer expiredOffer = new Offer();
        expiredOffer.setSlug("public-expired");
        expiredOffer.setTitle("Public Expired");
        expiredOffer.setShortDescription("Short");
        expiredOffer.setFullDescription("Full");
        expiredOffer.setDiscountType("PERCENTAGE");
        expiredOffer.setDiscountValue(new BigDecimal("10.00"));
        expiredOffer.setStayStartDate(LocalDate.now().minusDays(30));
        expiredOffer.setStayEndDate(LocalDate.now().minusDays(1)); // Expired yesterday
        expiredOffer.setStatus("ACTIVE");
        offerRepository.save(expiredOffer);

        Offer draftOffer = new Offer();
        draftOffer.setSlug("public-draft");
        draftOffer.setTitle("Public Draft");
        draftOffer.setShortDescription("Short");
        draftOffer.setFullDescription("Full");
        draftOffer.setDiscountType("PERCENTAGE");
        draftOffer.setDiscountValue(new BigDecimal("10.00"));
        draftOffer.setStayStartDate(LocalDate.now().plusDays(1));
        draftOffer.setStayEndDate(LocalDate.now().plusDays(30));
        draftOffer.setStatus("DRAFT");
        offerRepository.save(draftOffer);

        // Public request for hotel1
        mvc.perform(get("/api/public/offers?hotelId=" + hotel1.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].slug", hasItem("public-active")))
                .andExpect(jsonPath("$[*].slug", not(hasItem("public-expired"))))
                .andExpect(jsonPath("$[*].slug", not(hasItem("public-draft"))));
    }
}
