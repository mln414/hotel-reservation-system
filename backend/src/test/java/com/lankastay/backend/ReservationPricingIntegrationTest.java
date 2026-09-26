package com.lankastay.backend;

import com.lankastay.backend.dto.reservation.CreateReservationRequest;
import com.lankastay.backend.dto.reservation.ReservationQuoteRequest;
import com.lankastay.backend.dto.reservation.ReservationResponse;
import com.lankastay.backend.entity.*;
import com.lankastay.backend.exception.ConflictException;
import com.lankastay.backend.repository.*;
import com.lankastay.backend.service.CustomerReservationService;
import com.lankastay.backend.service.CustomerSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReservationPricingIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private HotelRepository hotelRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private RoomRateRepository rateRepository;
    @Autowired private OfferRepository offerRepository;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private CustomerUserRepository customerRepository;
    @Autowired private CustomerReservationService reservationService;

    private MockMvc mvc;
    private final JsonMapper jsonMapper = JsonMapper.builder().build();

    private Hotel hotel;
    private Room room;
    private RoomRate rate;
    private CustomerUser customer;
    private MockHttpSession session;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        hotel = createHotel("Pricing Test Hotel");

        room = roomRepository.save(new Room(hotel.getId(), "Pricing Deluxe Room", "pricing-deluxe-" + UUID.randomUUID(),
                "DELUXE", "Spacious room", 3, 2, 1, 35.0, "King", 10, 20000.0, "ACTIVE", "/room.png", "[]"));

        rate = rateRepository.save(new RoomRate(
                hotel.getId(), room.getId(), "Flexible BB", "FLEX-BB",
                new BigDecimal("20000.00"), new BigDecimal("25000.00"),
                "BED_AND_BREAKFAST", "FLEXIBLE_24H", false, BigDecimal.ZERO, "ACTIVE"
        ));

        CustomerUser c = new CustomerUser();
        c.setEmail("customer@test.com");
        c.setFirstName("Alice");
        c.setLastName("Customer");
        c.setPasswordHash("hash");
        c.setStatus("ACTIVE");
        customer = customerRepository.save(c);

        session = new MockHttpSession();
        session.setAttribute(CustomerSessionService.CUSTOMER_SESSION_KEY, customer.getId().toString());
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

    private LocalDate nextFutureMonday() {
        return LocalDate.now().plusWeeks(2).with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY));
    }

    private LocalDate nextFutureFriday() {
        return LocalDate.now().plusWeeks(2).with(TemporalAdjusters.nextOrSame(DayOfWeek.FRIDAY));
    }

    @Test
    void quoteCalculatesPercentageDiscountAccurately() throws Exception {
        LocalDate checkIn = nextFutureMonday();
        LocalDate checkOut = checkIn.plusDays(2); // Mon -> Wed (2 weekday nights = 20,000 * 2 = 40,000)

        Offer offer = new Offer();
        offer.setSlug("quote-10-percent");
        offer.setTitle("10% Discount Offer");
        offer.setShortDescription("Short");
        offer.setFullDescription("Full");
        offer.setDiscountType("PERCENTAGE");
        offer.setDiscountValue(new BigDecimal("10.00"));
        offer.setStayStartDate(checkIn.minusDays(5));
        offer.setStayEndDate(checkOut.plusDays(10));
        offer.setStatus("ACTIVE");
        offer.setTargetHotelIds(Set.of(hotel.getId()));
        Offer savedOffer = offerRepository.save(offer);

        ReservationQuoteRequest quoteReq = new ReservationQuoteRequest(
                hotel.getId(), room.getId(), rate.getId(),
                checkIn, checkOut, 2, 0, 1, savedOffer.getId()
        );

        mvc.perform(post("/api/v1/customer/reservations/quote")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(quoteReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true))
                .andExpect(jsonPath("$.nights").value(2))
                .andExpect(jsonPath("$.subtotal").value(40000.00))
                .andExpect(jsonPath("$.discount").value(4000.00))
                .andExpect(jsonPath("$.finalTotal").value(36000.00))
                .andExpect(jsonPath("$.appliedOffer.id").value(savedOffer.getId()))
                .andExpect(jsonPath("$.appliedOffer.title").value("10% Discount Offer"));
    }

    @Test
    void quoteCalculatesFixedDiscountPerStayAndPerNight() throws Exception {
        LocalDate checkIn = nextFutureMonday();
        LocalDate checkOut = checkIn.plusDays(2); // 2 nights

        // Per Stay fixed discount: 5,000 flat
        Offer perStayOffer = new Offer();
        perStayOffer.setSlug("flat-5000-off");
        perStayOffer.setTitle("Flat 5000 Off");
        perStayOffer.setShortDescription("Short");
        perStayOffer.setFullDescription("Full");
        perStayOffer.setDiscountType("FIXED_AMOUNT");
        perStayOffer.setDiscountValue(new BigDecimal("5000.00"));
        perStayOffer.setFixedDiscountScope("PER_STAY");
        perStayOffer.setStayStartDate(checkIn.minusDays(5));
        perStayOffer.setStayEndDate(checkOut.plusDays(10));
        perStayOffer.setStatus("ACTIVE");
        Offer savedPerStay = offerRepository.save(perStayOffer);

        ReservationQuoteRequest req1 = new ReservationQuoteRequest(
                hotel.getId(), room.getId(), rate.getId(),
                checkIn, checkOut, 2, 0, 1, savedPerStay.getId()
        );

        mvc.perform(post("/api/v1/customer/reservations/quote")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(req1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subtotal").value(40000.00))
                .andExpect(jsonPath("$.discount").value(5000.00))
                .andExpect(jsonPath("$.finalTotal").value(35000.00));

        // Per Night fixed discount: 3,000 per night * 2 nights = 6,000 discount
        Offer perNightOffer = new Offer();
        perNightOffer.setSlug("nightly-3000-off");
        perNightOffer.setTitle("Nightly 3000 Off");
        perNightOffer.setShortDescription("Short");
        perNightOffer.setFullDescription("Full");
        perNightOffer.setDiscountType("FIXED_AMOUNT");
        perNightOffer.setDiscountValue(new BigDecimal("3000.00"));
        perNightOffer.setFixedDiscountScope("PER_NIGHT");
        perNightOffer.setStayStartDate(checkIn.minusDays(5));
        perNightOffer.setStayEndDate(checkOut.plusDays(10));
        perNightOffer.setStatus("ACTIVE");
        Offer savedPerNight = offerRepository.save(perNightOffer);

        ReservationQuoteRequest req2 = new ReservationQuoteRequest(
                hotel.getId(), room.getId(), rate.getId(),
                checkIn, checkOut, 2, 0, 1, savedPerNight.getId()
        );

        mvc.perform(post("/api/v1/customer/reservations/quote")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(req2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subtotal").value(40000.00))
                .andExpect(jsonPath("$.discount").value(6000.00))
                .andExpect(jsonPath("$.finalTotal").value(34000.00));
    }

    @Test
    void quotePicksBestEligibleOfferWhenNoOfferIdSpecified() throws Exception {
        LocalDate checkIn = nextFutureMonday();
        LocalDate checkOut = checkIn.plusDays(2); // Subtotal = 40,000

        // Offer 1: 10% off (savings = 4,000)
        Offer offer1 = new Offer();
        offer1.setSlug("offer-10");
        offer1.setTitle("10% Off");
        offer1.setShortDescription("Short");
        offer1.setFullDescription("Full");
        offer1.setDiscountType("PERCENTAGE");
        offer1.setDiscountValue(new BigDecimal("10.00"));
        offer1.setStayStartDate(checkIn.minusDays(5));
        offer1.setStayEndDate(checkOut.plusDays(10));
        offer1.setStatus("ACTIVE");
        offerRepository.save(offer1);

        // Offer 2: 25% off (savings = 10,000) -> BEST
        Offer offer2 = new Offer();
        offer2.setSlug("offer-25");
        offer2.setTitle("25% Off");
        offer2.setShortDescription("Short");
        offer2.setFullDescription("Full");
        offer2.setDiscountType("PERCENTAGE");
        offer2.setDiscountValue(new BigDecimal("25.00"));
        offer2.setStayStartDate(checkIn.minusDays(5));
        offer2.setStayEndDate(checkOut.plusDays(10));
        offer2.setStatus("ACTIVE");
        Offer savedBest = offerRepository.save(offer2);

        // Request WITHOUT offerId
        ReservationQuoteRequest quoteReq = new ReservationQuoteRequest(
                hotel.getId(), room.getId(), rate.getId(),
                checkIn, checkOut, 2, 0, 1, null
        );

        mvc.perform(post("/api/v1/customer/reservations/quote")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(quoteReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.discount").value(10000.00))
                .andExpect(jsonPath("$.finalTotal").value(30000.00))
                .andExpect(jsonPath("$.appliedOffer.id").value(savedBest.getId()));
    }

    @Test
    void reservationCreationStoresOfferSnapshotAndPreventsPriceTampering() {
        LocalDate checkIn = nextFutureMonday();
        LocalDate checkOut = checkIn.plusDays(2);

        Offer offer = new Offer();
        offer.setSlug("snapshot-offer-test");
        offer.setTitle("Snapshot Special 20%");
        offer.setShortDescription("Short");
        offer.setFullDescription("Full");
        offer.setDiscountType("PERCENTAGE");
        offer.setDiscountValue(new BigDecimal("20.00"));
        offer.setStayStartDate(checkIn.minusDays(5));
        offer.setStayEndDate(checkOut.plusDays(10));
        offer.setStatus("ACTIVE");
        Offer savedOffer = offerRepository.save(offer);

        CreateReservationRequest createReq = new CreateReservationRequest(
                hotel.getId(), room.getId(), rate.getId(),
                checkIn, checkOut, 2, 0, 1,
                "Alice", "Customer", "alice@test.com", "+94771112233",
                "Late check-in please", "14:00", savedOffer.getId()
        );

        ReservationResponse response = reservationService.create(customer.getId(), createReq);

        assertNotNull(response.id());
        assertEquals(new BigDecimal("40000.00"), response.subtotalAmount());
        assertEquals(new BigDecimal("8000.00"), response.discountAmount()); // 20% of 40,000 = 8,000
        assertEquals(new BigDecimal("32000.00"), response.totalAmount());
        assertEquals(savedOffer.getId(), response.appliedOfferId());
        assertEquals("Snapshot Special 20%", response.offerTitleSnapshot());

        // Verify in DB directly
        Reservation dbRes = reservationRepository.findById(response.id()).orElseThrow();
        assertEquals(new BigDecimal("40000.00"), dbRes.getSubtotalAmount());
        assertEquals(new BigDecimal("8000.00"), dbRes.getDiscountAmount());
        assertEquals(new BigDecimal("32000.00"), dbRes.getTotalAmount());
        assertEquals("PERCENTAGE", dbRes.getDiscountTypeSnapshot());
        assertEquals(new BigDecimal("20.00"), dbRes.getDiscountValueSnapshot());
    }

    @Test
    void bookingFailsWithConflictIfOfferDeactivatedBeforeConfirmation() {
        LocalDate checkIn = nextFutureMonday();
        LocalDate checkOut = checkIn.plusDays(2);

        Offer offer = new Offer();
        offer.setSlug("expiring-offer");
        offer.setTitle("Expiring Offer");
        offer.setShortDescription("Short");
        offer.setFullDescription("Full");
        offer.setDiscountType("PERCENTAGE");
        offer.setDiscountValue(new BigDecimal("15.00"));
        offer.setStayStartDate(checkIn.minusDays(5));
        offer.setStayEndDate(checkOut.plusDays(10));
        offer.setStatus("INACTIVE"); // Inactive when confirm happens
        Offer savedOffer = offerRepository.save(offer);

        CreateReservationRequest createReq = new CreateReservationRequest(
                hotel.getId(), room.getId(), rate.getId(),
                checkIn, checkOut, 2, 0, 1,
                "Alice", "Customer", "alice@test.com", "+94771112233",
                null, null, savedOffer.getId()
        );

        ConflictException ex = assertThrows(ConflictException.class, () ->
                reservationService.create(customer.getId(), createReq));
        assertTrue(ex.getMessage().contains("no longer valid or eligible"));
    }

    @Test
    void subsequentRateOrOfferModificationsDoNotAlterHistoricalReservationReceipt() {
        LocalDate checkIn = nextFutureMonday();
        LocalDate checkOut = checkIn.plusDays(2);

        Offer offer = new Offer();
        offer.setSlug("historical-integrity-offer");
        offer.setTitle("Historical Integrity Offer");
        offer.setShortDescription("Short");
        offer.setFullDescription("Full");
        offer.setDiscountType("PERCENTAGE");
        offer.setDiscountValue(new BigDecimal("10.00"));
        offer.setStayStartDate(checkIn.minusDays(5));
        offer.setStayEndDate(checkOut.plusDays(10));
        offer.setStatus("ACTIVE");
        Offer savedOffer = offerRepository.save(offer);

        CreateReservationRequest createReq = new CreateReservationRequest(
                hotel.getId(), room.getId(), rate.getId(),
                checkIn, checkOut, 2, 0, 1,
                "Alice", "Customer", "alice@test.com", "+94771112233",
                null, null, savedOffer.getId()
        );

        ReservationResponse created = reservationService.create(customer.getId(), createReq);

        // Modify the rate and offer in the database after the reservation is made
        rate.setBaseNightlyRate(new BigDecimal("99000.00"));
        rateRepository.save(rate);

        savedOffer.setTitle("Brand New Altered Title");
        savedOffer.setDiscountValue(new BigDecimal("50.00"));
        savedOffer.setStatus("INACTIVE");
        offerRepository.save(savedOffer);

        // Fetch the historical reservation and verify it remains completely unchanged
        Reservation historical = reservationRepository.findById(created.id()).orElseThrow();
        assertEquals(new BigDecimal("40000.00"), historical.getSubtotalAmount());
        assertEquals(new BigDecimal("4000.00"), historical.getDiscountAmount());
        assertEquals(new BigDecimal("36000.00"), historical.getTotalAmount());
        assertEquals(new BigDecimal("36000.00"), historical.getNetAmount());
        assertEquals("Historical Integrity Offer", historical.getOfferTitleSnapshot());
        assertEquals(new BigDecimal("10.00"), historical.getDiscountValueSnapshot());
    }

    @Test
    void weekendPricingAppliesOnFridayAndSaturdayNights() {
        LocalDate checkIn = nextFutureFriday();
        LocalDate checkOut = checkIn.plusDays(2); // Friday night + Saturday night (check out Sunday)

        ReservationQuoteRequest quoteReq = new ReservationQuoteRequest(
                hotel.getId(), room.getId(), rate.getId(),
                checkIn, checkOut, 2, 0, 1, null
        );

        // Rate is 20,000 weekday, 25,000 weekend. Both Fri & Sat nights are weekend nights -> 25,000 * 2 = 50,000.00
        var quote = reservationService.quote(quoteReq);
        assertEquals(new BigDecimal("50000.00"), quote.subtotal());
        assertEquals(2, quote.nightlyPrices().size());
        assertEquals(new BigDecimal("25000.00"), quote.nightlyPrices().get(0).amount());
        assertEquals(new BigDecimal("25000.00"), quote.nightlyPrices().get(1).amount());
    }
}
