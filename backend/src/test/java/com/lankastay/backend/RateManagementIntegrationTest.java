package com.lankastay.backend;

import com.lankastay.backend.dto.rate.CreateRateRequest;
import com.lankastay.backend.dto.rate.RateStatusRequest;
import com.lankastay.backend.dto.rate.UpdateRateRequest;
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
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RateManagementIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private HotelRepository hotelRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private RoomRateRepository rateRepository;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private ReservationItemRepository itemRepository;
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
    private StaffPrincipal receptionist;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();

        hotel1 = createHotel("Rate Test Hotel 1");
        hotel2 = createHotel("Rate Test Hotel 2");

        room1 = roomRepository.save(new Room(hotel1.getId(), "Room 1", "room-1-" + UUID.randomUUID(), "STANDARD",
                "Desc", 2, 2, 0, 25.0, "King", 5, 20000.0, "ACTIVE", "/cover.png", "[]"));
        room2 = roomRepository.save(new Room(hotel2.getId(), "Room 2", "room-2-" + UUID.randomUUID(), "STANDARD",
                "Desc", 2, 2, 0, 25.0, "King", 5, 20000.0, "ACTIVE", "/cover.png", "[]"));

        manager = createStaff("mgr@test.com", StaffRole.MANAGER, null);
        staffHotel1 = createStaff("staff1@test.com", StaffRole.HOTEL_STAFF, hotel1.getId());
        staffHotel2 = createStaff("staff2@test.com", StaffRole.HOTEL_STAFF, hotel2.getId());
        receptionist = createStaff("recep@test.com", StaffRole.RECEPTIONIST, hotel1.getId());
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
    void managerCanCreateRateSuccessfully() throws Exception {
        CreateRateRequest req = new CreateRateRequest(
                hotel1.getId(), room1.getId(), "Summer Special Plan", "SUMMER26",
                "SEASONAL", "SET_PRICE", new BigDecimal("25000.00"), new BigDecimal("28000.00"),
                LocalDate.now().plusDays(10), LocalDate.now().plusDays(40), 2,
                "MON,TUE,WED,THU,FRI,SAT,SUN", "BED_AND_BREAKFAST", "FLEXIBLE_24H",
                true, new BigDecimal("10.00"), "Notes"
        );

        mvc.perform(post("/api/v1/management/rates")
                        .with(user(manager))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.ratePlanName").value("Summer Special Plan"))
                .andExpect(jsonPath("$.ratePlanCode").value("SUMMER26"))
                .andExpect(jsonPath("$.baseNightlyRate").value(25000.00))
                .andExpect(jsonPath("$.weekendNightlyRate").value(28000.00))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void rateCreationFailsOnCrossPropertyMismatch() throws Exception {
        // room1 belongs to hotel1, but request specifies hotel2
        CreateRateRequest req = new CreateRateRequest(
                hotel2.getId(), room1.getId(), "Cross Property Rate", "CROSS26",
                "BASE", "SET_PRICE", new BigDecimal("20000.00"), null,
                null, null, 1, null, "ROOM_ONLY", "FLEXIBLE_24H", false, BigDecimal.ZERO, null
        );

        mvc.perform(post("/api/v1/management/rates")
                        .with(user(manager))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Cross-property mismatch")));
    }

    @Test
    void rateCreationFailsOnInvalidDatesOrNegativePrice() throws Exception {
        CreateRateRequest invalidDates = new CreateRateRequest(
                hotel1.getId(), room1.getId(), "Invalid Date Rate", "INVDATE",
                "BASE", "SET_PRICE", new BigDecimal("20000.00"), null,
                LocalDate.now().plusDays(30), LocalDate.now().plusDays(10), // validTo is before validFrom
                1, null, "ROOM_ONLY", "FLEXIBLE_24H", false, BigDecimal.ZERO, null
        );

        mvc.perform(post("/api/v1/management/rates")
                        .with(user(manager))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(invalidDates)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Valid to date cannot be before valid from date")));

        CreateRateRequest negativePrice = new CreateRateRequest(
                hotel1.getId(), room1.getId(), "Negative Rate", "NEGRATE",
                "BASE", "SET_PRICE", new BigDecimal("-50.00"), null,
                null, null, 1, null, "ROOM_ONLY", "FLEXIBLE_24H", false, BigDecimal.ZERO, null
        );

        mvc.perform(post("/api/v1/management/rates")
                        .with(user(manager))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(negativePrice)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void staffCanUpdateOwnHotelRateButCannotUpdateOtherHotelRate() throws Exception {
        RoomRate rate1 = rateRepository.save(new RoomRate(
                hotel1.getId(), room1.getId(), "Flexible", "FLEX",
                new BigDecimal("20000.00"), new BigDecimal("22000.00"),
                "ROOM_ONLY", "FLEXIBLE_24H", false, BigDecimal.ZERO, "ACTIVE"
        ));
        RoomRate rate2 = rateRepository.save(new RoomRate(
                hotel2.getId(), room2.getId(), "Flexible 2", "FLEX2",
                new BigDecimal("25000.00"), new BigDecimal("27000.00"),
                "ROOM_ONLY", "FLEXIBLE_24H", false, BigDecimal.ZERO, "ACTIVE"
        ));

        UpdateRateRequest updateReq = new UpdateRateRequest(
                "Updated Flexible", "FLEX", "BASE", "SET_PRICE",
                new BigDecimal("21000.00"), new BigDecimal("23000.00"),
                null, null, 1, null, "ROOM_ONLY", "FLEXIBLE_24H", false, BigDecimal.ZERO, "Updated"
        );

        // staffHotel1 updates rate1 (own hotel) -> Success
        mvc.perform(put("/api/v1/management/rates/" + rate1.getId())
                        .with(user(staffHotel1))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.baseNightlyRate").value(21000.00));

        // staffHotel1 updates rate2 (other hotel) -> 403 Forbidden
        mvc.perform(put("/api/v1/management/rates/" + rate2.getId())
                        .with(user(staffHotel1))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    void staffCannotChangeStatusOrDeleteRates() throws Exception {
        RoomRate rate1 = rateRepository.save(new RoomRate(
                hotel1.getId(), room1.getId(), "Flexible", "FLEX",
                new BigDecimal("20000.00"), new BigDecimal("22000.00"),
                "ROOM_ONLY", "FLEXIBLE_24H", false, BigDecimal.ZERO, "ACTIVE"
        ));

        // Staff tries to toggle status -> 403
        mvc.perform(patch("/api/v1/management/rates/" + rate1.getId() + "/status")
                        .with(user(staffHotel1))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(new RateStatusRequest("INACTIVE"))))
                .andExpect(status().isForbidden());

        // Staff tries to delete -> 403
        mvc.perform(delete("/api/v1/management/rates/" + rate1.getId())
                        .with(user(staffHotel1))
                        .with(csrf()))
                .andExpect(status().isForbidden());

        // Receptionist tries to create rate -> 403
        CreateRateRequest req = new CreateRateRequest(
                hotel1.getId(), room1.getId(), "Recep Rate", "RECEPRATE",
                "BASE", "SET_PRICE", new BigDecimal("20000.00"), null,
                null, null, 1, null, "ROOM_ONLY", "FLEXIBLE_24H", false, BigDecimal.ZERO, null
        );
        mvc.perform(post("/api/v1/management/rates")
                        .with(user(receptionist))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    void managerCanToggleStatusAndSafeDeleteRate() throws Exception {
        RoomRate rate = rateRepository.save(new RoomRate(
                hotel1.getId(), room1.getId(), "Flexible To Delete", "FLEXDEL",
                new BigDecimal("20000.00"), new BigDecimal("22000.00"),
                "ROOM_ONLY", "FLEXIBLE_24H", false, BigDecimal.ZERO, "ACTIVE"
        ));

        // Manager deactivates
        mvc.perform(patch("/api/v1/management/rates/" + rate.getId() + "/status")
                        .with(user(manager))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(new RateStatusRequest("INACTIVE"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));

        // Manager deletes unused rate -> 204 No Content
        mvc.perform(delete("/api/v1/management/rates/" + rate.getId())
                        .with(user(manager))
                        .with(csrf()))
                .andExpect(status().isNoContent());

        assertFalse(rateRepository.existsById(rate.getId()));
    }

    @Test
    void rateDeletionFailsWithConflictWhenReferencedInReservation() throws Exception {
        RoomRate referencedRate = rateRepository.save(new RoomRate(
                hotel1.getId(), room1.getId(), "Referenced Rate", "REF-RATE",
                new BigDecimal("20000.00"), new BigDecimal("22000.00"),
                "ROOM_ONLY", "FLEXIBLE_24H", false, BigDecimal.ZERO, "ACTIVE"
        ));

        Reservation res = new Reservation();
        res.setReservationCode("LS-TEST-REF");
        res.setHotelId(hotel1.getId());
        res.setCustomerId(UUID.randomUUID());
        res.setGuestName("Test Guest");
        res.setGuestEmail("guest@test.com");
        res.setCheckIn(LocalDate.now().plusDays(5));
        res.setCheckOut(LocalDate.now().plusDays(7));
        res.setNumberOfNights(2);
        res.setAdults(2);
        res.setChildren(0);
        res.setSubtotalAmount(new BigDecimal("40000.00"));
        res.setDiscountAmount(BigDecimal.ZERO);
        res.setTotalAmount(new BigDecimal("40000.00"));
        res.setNetAmount(new BigDecimal("40000.00"));
        res.setPaymentStatus(PaymentStatus.PENDING);
        res.setReservationStatus(ReservationStatus.CONFIRMED);
        res.setAssignmentState(AssignmentState.UNASSIGNED);
        Reservation savedRes = reservationRepository.save(res);

        ReservationItem item = new ReservationItem();
        item.setReservationId(savedRes.getId());
        item.setRoomId(room1.getId());
        item.setRoomRateId(referencedRate.getId());
        item.setQuantity(1);
        item.setNightlyRate(new BigDecimal("20000.00"));
        item.setTotalPrice(new BigDecimal("40000.00"));
        item.setRoomNameSnapshot(room1.getName());
        itemRepository.save(item);

        // Attempt deletion -> 409 Conflict
        mvc.perform(delete("/api/v1/management/rates/" + referencedRate.getId())
                        .with(user(manager))
                        .with(csrf()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("reservation history references it")));
    }
}
