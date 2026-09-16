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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;

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

    @org.springframework.boot.test.context.TestConfiguration
    static class FastPasswordConfig {
        @Bean @Primary PasswordEncoder fastPasswordEncoder() { return new BCryptPasswordEncoder(4); }
    }

    private Long destinationId;

    @BeforeEach
    void setup() {
        audits.deleteAll();
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
                    "price": 55000
                }
                """;
        mvc.perform(put("/api/v1/hotels/" + id)
                        .session(session(login))
                        .with(csrf())
                        .contentType("application/json")
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("LankaStay Heritage Villa & Spa"));

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
                        .session(session(login))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hotelId").value(id));

        assertThat(hotels.findById(id)).isEmpty();
        assertThat(audits.findAll()).extracting(SecurityAudit::getEventType)
                .contains(SecurityEventType.HOTEL_UPDATED, SecurityEventType.HOTEL_ACTIVATED, SecurityEventType.HOTEL_DEACTIVATED, SecurityEventType.HOTEL_DELETED);
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
