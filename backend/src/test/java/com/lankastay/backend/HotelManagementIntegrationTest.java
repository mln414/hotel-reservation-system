// SE2030 LankaStay - Hotel Management
// Functional Owner: Wickramasinghe M.P.T.H - IT25300115

package com.lankastay.backend;

import com.lankastay.backend.entity.*;
import com.lankastay.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class HotelManagementIntegrationTest {

    private static final String PASSWORD = "TestPassword#2026";

    @Autowired MockMvc mvc;
    @Autowired StaffUserRepository users;
    @Autowired HotelRepository hotels;
    @Autowired DestinationRepository destinations;
    @Autowired SecurityAuditRepository audits;
    @Autowired PasswordEncoder encoder;
    @Autowired JdbcTemplate jdbcTemplate;
    @Autowired OfferRepository offers;

    @org.springframework.boot.test.context.TestConfiguration
    static class FastPasswordConfig {
        @Bean @Primary PasswordEncoder fastPasswordEncoder() { return new BCryptPasswordEncoder(4); }
    }

    private Long destinationId;

    @BeforeEach
    void setup() {
        audits.deleteAll();
        offers.deleteAll();
        hotels.deleteAll();
        users.deleteAll();
        destinations.deleteAll();

        Destination dest = new Destination();
        dest.setName("Test Colombo");
        dest.setSlug("test-colombo");
        dest.setShortDescription("Test destination short");
        dest.setFullDescription("Test destination full");
        dest.setCategory("Urban");
        dest.setRegion("Western");
        dest.setDistrict("Colombo");
        dest.setLatitude(6.9271);
        dest.setLongitude(79.8612);
        dest.setStatus(DestinationStatus.ACTIVE);
        dest.setMainImage("/assets/test.png");
        destinationId = destinations.save(dest).getId();
    }

    @Test
    void managerCanCreateAndGetAndListHotels() throws Exception {
        createStaff("manager@lankastay.local", StaffRole.MANAGER, null);
        MvcResult login = login("manager@lankastay.local", PASSWORD).andReturn();

        String createJson = """
                {
                    "name": "LankaStay Grand Palace",
                    "destinationId": %d,
                    "propertyType": "Hotel",
                    "category": "City Hotel",
                    "price": 45000,
                    "mainImage": "/images/grand.png",
                    "shortDescription": "Luxury city hotel",
                    "address": "123 Main Street, Colombo"
                }
                """.formatted(destinationId);

        MvcResult createResult = mvc.perform(post("/api/v1/hotels")
                        .session(session(login))
                        .with(csrf())
                        .contentType("application/json")
                        .content(createJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("LankaStay Grand Palace"))
                .andExpect(jsonPath("$.setupStatus").value("COMPLETE"))
                .andExpect(jsonPath("$.publicationStatus").value("INACTIVE"))
                .andReturn();

        Long newHotelId = hotels.findAll().get(0).getId();

        // Get hotel by ID
        mvc.perform(get("/api/v1/hotels/" + newHotelId).session(session(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("LankaStay Grand Palace"));

        // List hotels
        mvc.perform(get("/api/v1/hotels").session(session(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        assertThat(audits.findAll()).extracting(SecurityAudit::getEventType).contains(SecurityEventType.HOTEL_CREATED);
    }

    @Test
    void managerCanUpdateAndActivateAndDeactivateAndDeleteHotel() throws Exception {
        createStaff("manager@lankastay.local", StaffRole.MANAGER, null);
        MvcResult login = login("manager@lankastay.local", PASSWORD).andReturn();

        Hotel hotel = createTestHotel("LankaStay Heritage Villa", destinationId);
        Long id = hotel.getId();

        // Update hotel
        String updateJson = """
                {
                    "name": "LankaStay Heritage Villa & Spa",
                    "price": 55000,
                    "policyRecords": [
                        {
                            "id": "arrival",
                            "title": "Arrival policy",
                            "category": "CHECK_IN_OUT",
                            "summary": "Check-in begins at 2 PM.",
                            "details": "Valid identification is required at check-in.",
                            "status": "ACTIVE"
                        }
                    ]
                }
                """;
        mvc.perform(put("/api/v1/hotels/" + id)
                        .session(session(login))
                        .with(csrf())
                        .contentType("application/json")
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("LankaStay Heritage Villa & Spa"))
                .andExpect(jsonPath("$.policyRecords[0].title").value("Arrival policy"));

        assertThat(hotels.findById(id).orElseThrow().getPoliciesJson())
                .contains("Arrival policy");

        // Activate hotel
        mvc.perform(patch("/api/v1/hotels/" + id + "/status")
                        .session(session(login))
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"status\":\"ACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publicationStatus").value("ACTIVE"));

        // Deactivate hotel
        mvc.perform(patch("/api/v1/hotels/" + id + "/status")
                        .session(session(login))
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publicationStatus").value("INACTIVE"));

        // Delete hotel permanently
        mvc.perform(delete("/api/v1/hotels/" + id)
                        .param("confirmationName", "LankaStay Heritage Villa & Spa")
                        .session(session(login))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hotelId").value(id));

        assertThat(hotels.findById(id)).isEmpty();
        assertThat(audits.findAll()).extracting(SecurityAudit::getEventType)
                .contains(SecurityEventType.HOTEL_UPDATED, SecurityEventType.HOTEL_ACTIVATED, SecurityEventType.HOTEL_DEACTIVATED, SecurityEventType.HOTEL_DELETED);
    }

    @Test
    void permanentDeleteRequiresExactHotelName() throws Exception {
        createStaff("delete-manager@lankastay.local", StaffRole.MANAGER, null);
        MvcResult login = login("delete-manager@lankastay.local", PASSWORD).andReturn();
        Hotel hotel = createTestHotel("Exact Confirmation Hotel", destinationId);

        mvc.perform(delete("/api/v1/hotels/" + hotel.getId())
                        .param("confirmationName", "Wrong Hotel Name")
                        .session(session(login))
                        .with(csrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Type the exact Hotel name to confirm permanent deletion."));

        assertThat(hotels.existsById(hotel.getId())).isTrue();
    }

    @Test
    void permanentDeleteRemovesHotelOwnedDatabaseRecords() throws Exception {
        createStaff("cascade-manager@lankastay.local", StaffRole.MANAGER, null);
        MvcResult login = login("cascade-manager@lankastay.local", PASSWORD).andReturn();
        Hotel hotel = createTestHotel("Cascade Delete Hotel", destinationId);
        hotel.setFacilities(List.of("Pool", "Wi-Fi"));
        hotel.setGallery(List.of("/images/cascade.jpg"));
        hotel.setCollectionIds(List.of("luxury"));
        hotels.saveAndFlush(hotel);

        jdbcTemplate.update("INSERT INTO rooms (hotel_id,name,slug,room_category,max_occupancy,max_adults,max_children,inventory_count,base_price,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",
                hotel.getId(), "Delete Room", "delete-room", "DELUXE", 2, 2, 0, 1, 25000, "ACTIVE");
        Long roomId = jdbcTemplate.queryForObject("SELECT id FROM rooms WHERE hotel_id = ?", Long.class, hotel.getId());
        Hotel retainedHotel = createTestHotel("Retained Hotel", destinationId);
        Offer exclusiveOffer = createDeleteTestOffer("exclusive-delete", Set.of(hotel.getId()), Set.of());
        Offer sharedOffer = createDeleteTestOffer("shared-delete", Set.of(hotel.getId(), retainedHotel.getId()), Set.of());
        Offer roomOffer = createDeleteTestOffer("room-delete", Set.of(), Set.of(roomId));
        createStaff("assigned-delete@lankastay.local", StaffRole.HOTEL_STAFF, hotel.getId());
        jdbcTemplate.update("INSERT INTO room_rates (hotel_id,room_id,rate_plan_name,rate_plan_code,rate_type,pricing_method,base_nightly_rate,minimum_stay,meal_plan,cancellation_policy,deposit_required,deposit_percentage,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",
                hotel.getId(), roomId, "Base", "BASE", "BASE", "SET_PRICE", 25000, 1, "ROOM_ONLY", "FLEXIBLE_24H", false, 0, "ACTIVE");

        mvc.perform(delete("/api/v1/hotels/" + hotel.getId())
                        .param("confirmationName", hotel.getName())
                        .session(session(login))
                        .with(csrf()))
                .andExpect(status().isOk());

        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM hotels WHERE id = ?", Integer.class, hotel.getId())).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM rooms WHERE hotel_id = ?", Integer.class, hotel.getId())).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM room_rates WHERE hotel_id = ?", Integer.class, hotel.getId())).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM hotel_facilities WHERE hotel_id = ?", Integer.class, hotel.getId())).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM hotel_gallery WHERE hotel_id = ?", Integer.class, hotel.getId())).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM hotel_collections WHERE hotel_id = ?", Integer.class, hotel.getId())).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM offer_hotels WHERE hotel_id = ?", Integer.class, hotel.getId())).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM offer_rooms WHERE room_id = ?", Integer.class, roomId)).isZero();
        assertThat(users.findByEmail("assigned-delete@lankastay.local").orElseThrow().getAssignedHotelId()).isNull();
        assertThat(hotels.existsById(retainedHotel.getId())).isTrue();
        assertThat(offers.findById(exclusiveOffer.getId()).orElseThrow().getStatus()).isEqualTo("INACTIVE");
        assertThat(offers.findById(roomOffer.getId()).orElseThrow().getStatus()).isEqualTo("INACTIVE");
        Offer retainedOffer = offers.findById(sharedOffer.getId()).orElseThrow();
        assertThat(retainedOffer.getStatus()).isEqualTo("ACTIVE");
        assertThat(retainedOffer.getTargetHotelIds()).containsExactly(retainedHotel.getId());
    }

    private Offer createDeleteTestOffer(String slug, Set<Long> hotelIds, Set<Long> roomIds) {
        Offer offer = new Offer();
        offer.setSlug(slug);
        offer.setTitle(slug);
        offer.setShortDescription("Deletion regression offer");
        offer.setFullDescription("Deletion regression offer");
        offer.setDiscountType("PERCENTAGE");
        offer.setDiscountValue(BigDecimal.TEN);
        offer.setStayStartDate(LocalDate.now());
        offer.setStayEndDate(LocalDate.now().plusDays(30));
        offer.setStatus("ACTIVE");
        offer.setTargetHotelIds(hotelIds);
        offer.setTargetRoomTypeIds(roomIds);
        return offers.saveAndFlush(offer);
    }

    @Test
    void unauthorizedRoleCannotCreateOrDeleteHotel() throws Exception {
        createStaff("staff@lankastay.local", StaffRole.HOTEL_STAFF, 101L);
        MvcResult login = login("staff@lankastay.local", PASSWORD).andReturn();

        String createJson = """
                {
                    "name": "Unauthorized Hotel",
                    "destinationId": %d,
                    "propertyType": "Hotel"
                }
                """.formatted(destinationId);

        // Hotel staff cannot create hotel
        mvc.perform(post("/api/v1/hotels")
                        .session(session(login))
                        .with(csrf())
                        .contentType("application/json")
                        .content(createJson))
                .andExpect(status().isForbidden());

        Hotel hotel = createTestHotel("Protected Hotel", destinationId);

        // Hotel staff cannot delete hotel
        mvc.perform(delete("/api/v1/hotels/" + hotel.getId())
                        .param("confirmationName", hotel.getName())
                        .session(session(login))
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void publicDetailsOnlyExposeActiveHotelsAndReturnNotFoundSafely() throws Exception {
        Hotel hotel = createTestHotel("Private Draft Hotel", destinationId);

        mvc.perform(get("/api/public/hotels/" + hotel.getId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Active hotel not found")));

        hotel.setStatus("ACTIVE");
        hotel.setPublicationStatus("ACTIVE");
        hotels.saveAndFlush(hotel);

        mvc.perform(get("/api/public/hotels/" + hotel.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(hotel.getId()))
                .andExpect(jsonPath("$.destinationName").value("Test Colombo"));
    }

    private Hotel createTestHotel(String name, Long destId) {
        Hotel h = new Hotel();
        h.setName(name);
        h.setSlug(name.toLowerCase().replace(" ", "-"));
        h.setDestinationId(destId);
        h.setPropertyType("Resort");
        h.setPrice(BigDecimal.valueOf(40000));
        h.setMainImage("/images/test.png");
        h.setAddress("Test Address");
        h.setSetupStatus("COMPLETE");
        h.setStatus("INACTIVE");
        h.setPublicationStatus("INACTIVE");
        return hotels.save(h);
    }

    private StaffUser createStaff(String email, StaffRole role, Long assignedHotelId) {
        StaffUser user = new StaffUser();
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(role);
        user.setStatus(StaffStatus.ACTIVE);
        user.setMustChangePassword(false);
        user.setAssignedHotelId(assignedHotelId);
        user.setPasswordHash(encoder.encode(PASSWORD));
        return users.saveAndFlush(user);
    }

    private org.springframework.test.web.servlet.ResultActions login(String email, String password) throws Exception {
        return mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType("application/json")
                .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"));
    }

    private org.springframework.mock.web.MockHttpSession session(MvcResult result) {
        return (org.springframework.mock.web.MockHttpSession) result.getRequest().getSession(false);
    }
}
