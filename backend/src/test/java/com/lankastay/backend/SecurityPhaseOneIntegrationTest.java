package com.lankastay.backend;

import com.lankastay.backend.entity.*;
import com.lankastay.backend.repository.*;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;
import org.mockito.ArgumentCaptor;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SecurityPhaseOneIntegrationTest {
    static final String OLD = "Original1!SecurePassword";
    static final String NEW = "Replacement2@SecurePassword";
    static final String GENERIC = "{\"message\":\"If an account exists for that email, password reset instructions have been sent.\"}";
    static final String DEST = "{\"name\":\"Security Test Destination\",\"shortDescription\":\"A test location\",\"region\":\"Southern\",\"district\":\"Galle\",\"latitude\":6,\"longitude\":80}";
    static final String ATTRACTION = "{\"name\":\"Security Test Attraction\",\"type\":\"NATURE\"}";
    static final String DISCOUNT = "{\"code\":\"SECURITY10\",\"title\":\"Secure discount\",\"discountType\":\"PERCENTAGE\",\"discountValue\":10,\"minimumNights\":1,\"status\":\"ACTIVE\"}";
    @Autowired MockMvc mvc;
    @Autowired CustomerUserRepository customers;
    @Autowired StaffUserRepository staff;
    @Autowired PasswordResetTokenRepository tokens;
    @Autowired DiscountRepository discounts;
    @Autowired HotelRepository hotels;
    @Autowired PasswordEncoder encoder;
    @Autowired org.springframework.security.core.session.SessionRegistry sessionRegistry;
    @MockitoBean EmailService email;

    CustomerUser customer() {
        CustomerUser c = new CustomerUser();
        c.setEmail("phase1-" + UUID.randomUUID() + "@example.test"); c.setFirstName("C"); c.setLastName("User");
        c.setPasswordHash(encoder.encode(OLD)); return customers.saveAndFlush(c);
    }
    StaffUser staff(StaffRole role, Long hotel) {
        StaffUser u = new StaffUser(); u.setEmail("phase1-" + UUID.randomUUID() + "@example.test");
        u.setFirstName("S"); u.setLastName("User"); u.setRole(role); u.setStatus(StaffStatus.ACTIVE);
        u.setMustChangePassword(false); u.setAssignedHotelId(hotel); u.setPasswordHash(encoder.encode(OLD));
        return staff.saveAndFlush(u);
    }
    MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
        return request.with(csrf()).contentType("application/json").content(body);
    }
    String token(String address, boolean customer) throws Exception {
        reset(email);
        mvc.perform(json(post(customer ? "/api/v1/customer/auth/forgot-password" : "/api/v1/auth/forgot-password"),
                "{\"email\":\"" + address + "\"}").with(request -> { request.setRemoteAddr(UUID.randomUUID().toString()); return request; }))
                .andExpect(status().isOk()).andExpect(content().json(GENERIC));
        ArgumentCaptor<String> link = ArgumentCaptor.forClass(String.class);
        verify(email).sendPasswordReset(eq(address), link.capture());
        return link.getValue().split("token=")[1];
    }
    ResultActions resetToken(String token, boolean customer) throws Exception {
        return mvc.perform(json(post(customer ? "/api/v1/customer/auth/reset-password" : "/api/v1/auth/reset-password"),
                "{\"token\":\"" + token + "\",\"newPassword\":\"" + NEW + "\",\"confirmNewPassword\":\"" + NEW + "\"}"));
    }
    String hash(String raw) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));
    }
    PasswordResetToken row(String raw) throws Exception {
        return tokens.findAll().stream().filter(t -> t.getTokenHash().equals(uncheckedHash(raw))).findFirst().orElseThrow();
    }
    String uncheckedHash(String raw) { try { return hash(raw); } catch (Exception e) { throw new RuntimeException(e); } }

    @ParameterizedTest @ValueSource(strings={"/api/v1/auth", "/api/v1/customer/auth"})
    void retiredAnonymousEndpointsReturn404(String prefix) throws Exception {
        for (String suffix : List.of("/forgot-password/change-password", "/forgot-password/check-email")) {
            mvc.perform(json(post(prefix + suffix), "{\"email\":\"victim@example.test\",\"newPassword\":\"" + NEW + "\"}"))
                    .andExpect(status().isNotFound());
        }
        mvc.perform(get(prefix + "/dev-last-reset-link")).andExpect(status().isNotFound());
    }
    @ParameterizedTest @ValueSource(booleans={true,false})
    void requestKnownAndUnknownHaveIdenticalResponseAndOnlyKnownSendsEmail(boolean customerFlow) throws Exception {
        String address = customerFlow ? customer().getEmail() : staff(StaffRole.HOTEL_STAFF, null).getEmail();
        String path = customerFlow ? "/api/v1/customer/auth/forgot-password" : "/api/v1/auth/forgot-password";
        reset(email);
        String known = mvc.perform(json(post(path), "{\"email\":\"" + address + "\"}")
                .with(request -> { request.setRemoteAddr(UUID.randomUUID().toString()); return request; }))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String unknown = mvc.perform(json(post(path), "{\"email\":\"absent-" + UUID.randomUUID() + "@example.test\"}")
                .with(request -> { request.setRemoteAddr(UUID.randomUUID().toString()); return request; }))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertEquals(known, unknown); assertEquals(GENERIC, known);
        verify(email, times(1)).sendPasswordReset(eq(address), anyString());
    }
    @ParameterizedTest @ValueSource(booleans={true,false})
    void validTokenWorksOnceAndCannotCrossAccountNamespace(boolean customerFlow) throws Exception {
        CustomerUser c = customer(); StaffUser s = staff(StaffRole.HOTEL_STAFF, null);
        String beforeC = c.getPasswordHash(), beforeS = s.getPasswordHash();
        String raw = token(customerFlow ? c.getEmail() : s.getEmail(), customerFlow);
        assertEquals(hash(raw), row(raw).getTokenHash());
        assertFalse(row(raw).getTokenHash().contains(raw));
        resetToken(raw, !customerFlow).andExpect(status().isBadRequest());
        assertEquals(beforeC, c.getPasswordHash()); assertEquals(beforeS, s.getPasswordHash());
        resetToken(raw, customerFlow).andExpect(status().isOk());
        resetToken(raw, customerFlow).andExpect(status().isBadRequest());
        if (customerFlow) {
            assertTrue(encoder.matches(NEW, c.getPasswordHash())); assertEquals(beforeS, s.getPasswordHash());
        } else {
            assertTrue(encoder.matches(NEW, s.getPasswordHash())); assertEquals(beforeC, c.getPasswordHash());
        }
    }
    @ParameterizedTest @ValueSource(strings={"random","expired","used"})
    void invalidTokensNeverChangePassword(String kind) throws Exception {
        CustomerUser c = customer(); String before = c.getPasswordHash();
        String raw = token(c.getEmail(), true);
        if (kind.equals("expired")) row(raw).setExpiresAt(Instant.now().minusSeconds(1));
        if (kind.equals("used")) row(raw).setUsedAt(Instant.now());
        tokens.flush();
        resetToken(kind.equals("random") ? "not-a-real-token" : raw, true).andExpect(status().isBadRequest());
        assertEquals(before, customers.findById(c.getId()).orElseThrow().getPasswordHash());
    }
    @Test void overlappingEmailAddressesKeepStaffAndCustomerTokensSeparate() throws Exception {
        CustomerUser c = customer(); StaffUser s = staff(StaffRole.HOTEL_STAFF, null);
        s.setEmail(c.getEmail()); staff.flush();
        String staffBefore = s.getPasswordHash();
        String customerRaw = token(c.getEmail(), true), staffRaw = token(s.getEmail(), false);
        resetToken(customerRaw, false).andExpect(status().isBadRequest());
        resetToken(staffRaw, true).andExpect(status().isBadRequest());
        resetToken(customerRaw, true).andExpect(status().isOk());
        assertEquals(staffBefore, s.getPasswordHash());
        resetToken(staffRaw, false).andExpect(status().isOk());
        assertTrue(encoder.matches(NEW, c.getPasswordHash()));
        assertTrue(encoder.matches(NEW, s.getPasswordHash()));
    }
    @Test void newRequestInvalidatesPreviousToken() throws Exception {
        CustomerUser c = customer(); String first = token(c.getEmail(), true), second = token(c.getEmail(), true);
        resetToken(first, true).andExpect(status().isBadRequest());
        resetToken(second, true).andExpect(status().isOk());
    }
    @Test void customerResetRevokesActiveSessionAndClearsLock() throws Exception {
        CustomerUser c = customer();
        MockHttpSession session = (MockHttpSession) mvc.perform(json(post("/api/v1/customer/auth/login"),
                "{\"email\":\"" + c.getEmail() + "\",\"password\":\"" + OLD + "\"}"))
                .andExpect(status().isOk()).andReturn().getRequest().getSession();
        c.setFailedLoginAttempts(4); c.setLockedUntil(Instant.now().plusSeconds(900)); customers.flush();
        String raw = token(c.getEmail(), true); resetToken(raw, true).andExpect(status().isOk());
        assertEquals(0, c.getFailedLoginAttempts()); assertNull(c.getLockedUntil());
        mvc.perform(get("/api/v1/customer/auth/me").session(session)).andExpect(status().isUnauthorized());
    }
    @Test void staffResetRevokesSessionRegistryAndClearsLock() throws Exception {
        StaffUser s = staff(StaffRole.HOTEL_STAFF, null);
        MockHttpSession active = (MockHttpSession) mvc.perform(json(post("/api/v1/auth/login"),
                "{\"email\":\"" + s.getEmail() + "\",\"password\":\"" + OLD + "\"}"))
                .andExpect(status().isOk()).andReturn().getRequest().getSession();
        StaffPrincipal principal = StaffPrincipal.from(s);
        String sessionId = UUID.randomUUID().toString(); sessionRegistry.registerNewSession(sessionId, principal);
        s.setFailedLoginAttempts(4); s.setLockedUntil(Instant.now().plusSeconds(900)); staff.flush();
        resetToken(token(s.getEmail(), false), false).andExpect(status().isOk());
        assertTrue(sessionRegistry.getSessionInformation(sessionId).isExpired());
        mvc.perform(get("/api/v1/auth/me").session(active)).andExpect(status().isUnauthorized());
        assertEquals(0, s.getFailedLoginAttempts()); assertNull(s.getLockedUntil());
        sessionRegistry.removeSessionInformation(sessionId);
    }
    @Test void resetRequestsAreRateLimitedIndependentlyOfExistence() throws Exception {
        String ip = UUID.randomUUID().toString();
        for (int i=0;i<6;i++) {
            mvc.perform(json(post("/api/v1/auth/forgot-password"), "{\"email\":\"missing@example.test\"}")
                    .with(request -> { request.setRemoteAddr(ip); return request; }))
                    .andExpect(status().is(i < 5 ? 200 : 429));
        }
    }
    @ParameterizedTest @ValueSource(strings={"HOTEL_STAFF","RECEPTIONIST","CUSTOMER","ANONYMOUS"})
    void globalCatalogMutationsRejectEveryNonManager(String role) throws Exception {
        StaffUser u = Set.of("HOTEL_STAFF","RECEPTIONIST").contains(role) ? staff(StaffRole.valueOf(role), null) : null;
        var requests = List.of(json(post("/api/management/destinations"), DEST),
                json(put("/api/management/destinations/1"), "{}"),
                json(patch("/api/management/destinations/1/status"), "{\"status\":\"DRAFT\"}"),
                delete("/api/management/destinations/1").with(csrf()),
                json(post("/api/management/destinations/1/attractions"), ATTRACTION),
                json(put("/api/management/destinations/1/attractions/1"), "{\"status\":\"INACTIVE\"}"),
                delete("/api/management/destinations/1/attractions/1").with(csrf()));
        for (var request : requests) {
            if (u != null) request.with(user(StaffPrincipal.from(u)));
            if (role.equals("CUSTOMER")) {
                var c = customer(); var session = new MockHttpSession();
                session.setAttribute(CustomerSessionService.CUSTOMER_SESSION_KEY, c.getId().toString());
                request.session(session);
            }
            mvc.perform(request).andExpect(status().is(u == null ? 401 : 403));
        }
    }
    @Test void managerCanMutateGlobalDestinationAndAttractionCatalog() throws Exception {
        StaffPrincipal manager = StaffPrincipal.from(staff(StaffRole.MANAGER, null));
        String result = mvc.perform(json(post("/api/management/destinations"), DEST).with(user(manager)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long destinationId = extractId(result);
        String path = "/api/management/destinations/" + destinationId;
        mvc.perform(json(put(path), "{\"name\":\"Updated Security Destination\"}").with(user(manager))).andExpect(status().isOk());
        mvc.perform(json(patch(path + "/status"), "{\"status\":\"DRAFT\"}").with(user(manager))).andExpect(status().isOk());
        result = mvc.perform(json(post(path + "/attractions"), ATTRACTION).with(user(manager)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long attractionId = extractId(result);
        mvc.perform(json(put(path + "/attractions/" + attractionId), "{\"status\":\"INACTIVE\"}").with(user(manager))).andExpect(status().isOk());
        mvc.perform(delete(path + "/attractions/" + attractionId).with(csrf()).with(user(manager))).andExpect(status().isNoContent());
        mvc.perform(delete(path).with(csrf()).with(user(manager))).andExpect(status().isNoContent());
        mvc.perform(get("/api/destinations")).andExpect(status().isOk());
    }
    long extractId(String body) {
        var match = java.util.regex.Pattern.compile("\"id\"\\s*:\\s*(\\d+)").matcher(body);
        assertTrue(match.find()); return Long.parseLong(match.group(1));
    }
    Hotel hotel() {
        Hotel h = new Hotel(); h.setName("Security Hotel"); h.setSlug("security-" + UUID.randomUUID());
        h.setDestinationId(1L); h.setPropertyType("HOTEL"); return hotels.saveAndFlush(h);
    }
    Discount discount(Long hotelId) {
        Discount d = new Discount(hotelId, "code-" + UUID.randomUUID(), "Secure Discount", "", "PERCENTAGE",
                10.0, 1, null, null, "ACTIVE"); return discounts.saveAndFlush(d);
    }
    @Test void discountScopeAndMassAssignmentAreEnforced() throws Exception {
        Hotel a = hotel(), b = hotel(); Discount da = discount(a.getId()), db = discount(b.getId());
        StaffUser u = staff(StaffRole.HOTEL_STAFF, a.getId());
        mvc.perform(json(put("/api/v1/management/discounts/" + da.getId()), DISCOUNT).with(user(StaffPrincipal.from(u))))
                .andExpect(status().isOk());
        String injected = DISCOUNT.replace("\"code\":\"SECURITY10\"", "\"hotelId\":" + a.getId() + ",\"code\":\"ATTACK10\"");
        mvc.perform(json(put("/api/v1/management/discounts/" + db.getId()), injected).with(user(StaffPrincipal.from(u))))
                .andExpect(status().isForbidden());
        assertEquals(b.getId(), db.getHotelId()); assertNotEquals("ATTACK10", db.getCode());
        injected = DISCOUNT.replace("\"code\":\"SECURITY10\"", "\"id\":" + db.getId() + ",\"hotelId\":" + b.getId() + ",\"code\":\"OWN10\"");
        mvc.perform(json(put("/api/v1/management/discounts/" + da.getId()), injected).with(user(StaffPrincipal.from(u))))
                .andExpect(status().isOk());
        assertEquals(a.getId(), da.getHotelId()); assertNotEquals(db.getId(), da.getId());
        mvc.perform(get("/api/v1/management/discounts/" + db.getId()).with(user(StaffPrincipal.from(u)))).andExpect(status().isForbidden());
        StaffPrincipal stalePrincipal = StaffPrincipal.from(u);
        u.setAssignedHotelId(null); staff.flush();
        mvc.perform(json(put("/api/v1/management/discounts/" + da.getId()), DISCOUNT).with(user(stalePrincipal))).andExpect(status().isForbidden());
        mvc.perform(json(post("/api/v1/management/discounts"), DISCOUNT).with(user(StaffPrincipal.from(u)))).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/management/discounts").with(user(StaffPrincipal.from(u)))).andExpect(status().isForbidden());
    }
    @Test void managerAllowedAndReceptionistDeniedDiscountMutations() throws Exception {
        Hotel h = hotel(); Discount d = discount(h.getId());
        StaffPrincipal manager = StaffPrincipal.from(staff(StaffRole.MANAGER, null));
        mvc.perform(json(put("/api/v1/management/discounts/" + d.getId()), DISCOUNT).with(user(manager))).andExpect(status().isOk());
        StaffPrincipal receptionist = StaffPrincipal.from(staff(StaffRole.RECEPTIONIST, h.getId()));
        mvc.perform(json(put("/api/v1/management/discounts/" + d.getId()), DISCOUNT).with(user(receptionist))).andExpect(status().isForbidden());
        mvc.perform(json(post("/api/v1/management/discounts"), DISCOUNT).with(user(receptionist))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/management/discounts/" + d.getId()).with(csrf()).with(user(receptionist))).andExpect(status().isForbidden());
    }
    @Test void nonexistentHotelFailsClosedAndPublicValidationIsReachable() throws Exception {
        Discount d = discount(99999999L);
        StaffPrincipal principal = StaffPrincipal.from(staff(StaffRole.HOTEL_STAFF, 99999999L));
        mvc.perform(json(put("/api/v1/management/discounts/" + d.getId()), DISCOUNT).with(user(principal))).andExpect(status().isForbidden());
        Discount publicDiscount = discount(null);
        for (String path : List.of("/api/public/discounts/validate", "/api/v1/management/discounts/validate")) {
            mvc.perform(get(path).param("code", publicDiscount.getCode())).andExpect(status().isOk())
                    .andExpect(header().string("X-Content-Type-Options","nosniff"))
                    .andExpect(header().exists("Content-Security-Policy"));
        }
    }

    @Test void uploadEndpointInspectsBytesAndServesOnlyInertImages() throws Exception {
        StaffPrincipal manager = StaffPrincipal.from(staff(StaffRole.MANAGER, null));
        for (String payload : List.of("<html><script>alert(1)</script></html>", "<svg onload='alert(1)'/>", "random bytes")) {
            mvc.perform(multipart("/api/media/upload").file(new org.springframework.mock.web.MockMultipartFile(
                    "file", "payload.png", "image/png", payload.getBytes())).with(csrf()).with(user(manager)))
                    .andExpect(status().isBadRequest());
        }
        java.io.ByteArrayOutputStream bytes = new java.io.ByteArrayOutputStream();
        javax.imageio.ImageIO.write(new java.awt.image.BufferedImage(2,2,java.awt.image.BufferedImage.TYPE_INT_RGB), "png", bytes);
        String body = mvc.perform(multipart("/api/media/upload").file(new org.springframework.mock.web.MockMultipartFile(
                "file", "cover.png", "text/html", bytes.toByteArray())).with(csrf()).with(user(manager)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var match = java.util.regex.Pattern.compile("\"url\"\\s*:\\s*\"([^\"]+)\"").matcher(body);
        assertTrue(match.find());
        mvc.perform(get(match.group(1))).andExpect(status().isOk()).andExpect(content().contentType("image/png"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff")).andExpect(header().exists("Content-Security-Policy"));
        mvc.perform(get("/uploads/destinations/payload.svg")).andExpect(status().isNotFound());
        mvc.perform(get("/uploads/destinations/payload.html")).andExpect(status().isNotFound());
    }

    @Test void discountCreateUsesAssignedHotelAndRejectsInjectedOwnership() throws Exception {
        Hotel a = hotel(), b = hotel();
        StaffPrincipal principal = StaffPrincipal.from(staff(StaffRole.HOTEL_STAFF, a.getId()));
        mvc.perform(json(post("/api/v1/management/discounts"), DISCOUNT).with(user(principal)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.hotelId").value(a.getId()));
        String attack = DISCOUNT.replace("\"code\":\"SECURITY10\"", "\"hotelId\":" + b.getId() + ",\"code\":\"ATTACK-CREATE\"");
        mvc.perform(json(post("/api/v1/management/discounts"), attack).with(user(principal))).andExpect(status().isForbidden());
    }
}
