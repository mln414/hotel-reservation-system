package com.lankastay.backend;

import com.lankastay.backend.entity.*;
import com.lankastay.backend.repository.SecurityAuditRepository;
import com.lankastay.backend.repository.StaffUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = { "lankastay.security.max-failed-attempts=5", "lankastay.security.ip-max-attempts=1000" })
class AuthenticationIntegrationTest {
    private static final String PASSWORD = "Correct1!HorseBatteryStaple";
    private static final String NEW_PASSWORD = "Better2@PermanentPassword";

    @Autowired MockMvc mvc;
    @Autowired StaffUserRepository users;
    @Autowired SecurityAuditRepository audits;
    @Autowired PasswordEncoder encoder;

    @org.springframework.boot.test.context.TestConfiguration
    static class FastPasswordConfig {
        @Bean @Primary PasswordEncoder fastPasswordEncoder() { return new BCryptPasswordEncoder(4); }
    }

    @BeforeEach
    void clean() {
        audits.deleteAll();
        users.deleteAll();
    }

    @Test void validManagerAndStaffLogin() throws Exception {
        create("manager@lankastay.lk", StaffRole.MANAGER, StaffStatus.ACTIVE, false);
        create("staff@lankastay.lk", StaffRole.HOTEL_STAFF, StaffStatus.ACTIVE, false);
        login("  MANAGER@LANKASTAY.LK  ", PASSWORD).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("AUTHENTICATED"));
        login("staff@lankastay.lk", PASSWORD).andExpect(status().isOk()).andExpect(jsonPath("$.user.role").value("HOTEL_STAFF"));
    }

    @Test void invalidAndUnknownEmailHaveSameGenericResponse() throws Exception {
        create("known@lankastay.lk", StaffRole.HOTEL_STAFF, StaffStatus.ACTIVE, false);
        String wrong = login("known@lankastay.lk", "wrong password value").andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString();
        String unknown = login("unknown@lankastay.lk", "wrong password value").andExpect(status().isUnauthorized()).andReturn().getResponse().getContentAsString();
        assertThat(wrong).contains("Invalid email or password");
        assertThat(unknown).contains("Invalid email or password");
    }

    @Test void disabledAndLockedAccountsCannotLogin() throws Exception {
        create("disabled@lankastay.lk", StaffRole.HOTEL_STAFF, StaffStatus.DISABLED, false);
        create("locked@lankastay.lk", StaffRole.HOTEL_STAFF, StaffStatus.LOCKED, false);
        login("disabled@lankastay.lk", PASSWORD).andExpect(status().isUnauthorized());
        login("locked@lankastay.lk", PASSWORD).andExpect(status().isUnauthorized());
    }

    @Test void temporaryUserIsRestrictedUntilInitialPasswordChange() throws Exception {
        create("temporary@lankastay.lk", StaffRole.HOTEL_STAFF, StaffStatus.ACTIVE, true);
        MvcResult login = login("temporary@lankastay.lk", PASSWORD)
                .andExpect(jsonPath("$.status").value("PASSWORD_CHANGE_REQUIRED")).andReturn();
        mvc.perform(get("/api/management/destinations").session(session(login)))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/auth/change-initial-password").session(session(login)).with(csrf())
                        .contentType("application/json")
                        .content("{\"currentPassword\":\"Wrong1!Current\",\"newPassword\":\"" + NEW_PASSWORD + "\",\"confirmNewPassword\":\"" + NEW_PASSWORD + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Current password is incorrect."));
        mvc.perform(post("/api/v1/auth/change-initial-password").session(session(login)).with(csrf())
                        .contentType("application/json")
                        .content("{\"currentPassword\":\"" + PASSWORD + "\",\"newPassword\":\"" + NEW_PASSWORD + "\",\"confirmNewPassword\":\"" + NEW_PASSWORD + "\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.mustChangePassword").value(false));
        mvc.perform(get("/api/management/destinations").session(session(login))).andExpect(status().isOk());
        mvc.perform(post("/api/v1/auth/logout").session(session(login)).with(csrf())).andExpect(status().isNoContent());
        login("temporary@lankastay.lk", PASSWORD).andExpect(status().isUnauthorized());
        login("temporary@lankastay.lk", NEW_PASSWORD).andExpect(status().isOk());
        assertThat(audits.findAll()).extracting(SecurityAudit::getEventType).contains(SecurityEventType.INITIAL_PASSWORD_CHANGED);
    }

    @Test void normalPasswordChangeRequiresCurrentAndRejectsReuse() throws Exception {
        StaffUser user = create("change@lankastay.lk", StaffRole.HOTEL_STAFF, StaffStatus.ACTIVE, false);
        MvcResult login = login(user.getEmail(), PASSWORD).andReturn();
        mvc.perform(post("/api/v1/auth/change-password").session(session(login)).with(csrf()).contentType("application/json")
                        .content("{\"currentPassword\":\"incorrect current value\",\"newPassword\":\"" + NEW_PASSWORD + "\",\"confirmNewPassword\":\"" + NEW_PASSWORD + "\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/v1/auth/change-password").session(session(login)).with(csrf()).contentType("application/json")
                        .content("{\"currentPassword\":\"" + PASSWORD + "\",\"newPassword\":\"" + NEW_PASSWORD + "\",\"confirmNewPassword\":\"" + NEW_PASSWORD + "\"}"))
                .andExpect(status().isOk());
        assertThat(encoder.matches(NEW_PASSWORD, users.findById(user.getId()).orElseThrow().getPasswordHash())).isTrue();
        assertThat(audits.findAll()).extracting(SecurityAudit::getEventType).contains(SecurityEventType.PASSWORD_CHANGED);
    }

    @Test void anonymousAndWrongRoleCannotAdministerStaff() throws Exception {
        mvc.perform(post("/api/v1/admin/staff").with(csrf()).contentType("application/json").content(createStaffJson("HOTEL_STAFF")))
                .andExpect(status().isUnauthorized());
        create("reception@lankastay.lk", StaffRole.RECEPTIONIST, StaffStatus.ACTIVE, false);
        MvcResult login = login("reception@lankastay.lk", PASSWORD).andReturn();
        mvc.perform(post("/api/v1/admin/staff").session(session(login)).with(csrf()).contentType("application/json").content(createStaffJson("HOTEL_STAFF")))
                .andExpect(status().isForbidden());
    }

    @Test void managerCreatesStaffAndTemporaryPasswordIsOnlyReturnedOnceAndHashed() throws Exception {
        create("manager@lankastay.lk", StaffRole.MANAGER, StaffStatus.ACTIVE, false);
        MvcResult login = login("manager@lankastay.lk", PASSWORD).andReturn();
        MvcResult created = mvc.perform(post("/api/v1/admin/staff").session(session(login)).with(csrf()).contentType("application/json").content(createStaffJson("HOTEL_STAFF")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.temporaryPassword").isString())
                .andExpect(jsonPath("$.staff.passwordHash").doesNotExist()).andReturn();
        String body = created.getResponse().getContentAsString();
        String temporaryPassword = body.replaceAll(".*\\\"temporaryPassword\\\":\\\"([^\\\"]+)\\\".*", "$1");
        StaffUser saved = users.findByEmail("new.staff@lankastay.lk").orElseThrow();
        assertThat(body).doesNotContain(saved.getPasswordHash());
        assertThat(encoder.matches(temporaryPassword, saved.getPasswordHash())).isTrue();
        assertThat(saved.isMustChangePassword()).isTrue();
        assertThat(saved.getRole()).isEqualTo(StaffRole.HOTEL_STAFF);
        mvc.perform(get("/api/v1/admin/staff/" + saved.getId()).session(session(login)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.temporaryPassword").doesNotExist()).andExpect(jsonPath("$.passwordHash").doesNotExist());

        MvcResult staffLogin = login(saved.getEmail(), temporaryPassword)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PASSWORD_CHANGE_REQUIRED"))
                .andReturn();
        mvc.perform(get("/api/management/destinations").session(session(staffLogin)))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/auth/change-initial-password").session(session(staffLogin)).with(csrf())
                        .contentType("application/json")
                        .content("{\"currentPassword\":\"" + temporaryPassword + "\",\"newPassword\":\"" + NEW_PASSWORD + "\",\"confirmNewPassword\":\"" + NEW_PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mustChangePassword").value(false));
        login(saved.getEmail(), temporaryPassword).andExpect(status().isUnauthorized());
        login(saved.getEmail(), NEW_PASSWORD).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AUTHENTICATED"));
    }

    @Test void clientCannotProvisionOrPromoteManager() throws Exception {
        StaffUser manager = create("manager@lankastay.lk", StaffRole.MANAGER, StaffStatus.ACTIVE, false);
        MvcResult login = login(manager.getEmail(), PASSWORD).andReturn();
        mvc.perform(post("/api/v1/admin/staff").session(session(login)).with(csrf()).contentType("application/json").content(createStaffJson("MANAGER")))
                .andExpect(status().isBadRequest());
        StaffUser staff = create("target@lankastay.lk", StaffRole.HOTEL_STAFF, StaffStatus.ACTIVE, false);
        mvc.perform(patch("/api/v1/admin/staff/" + staff.getId()).session(session(login)).with(csrf()).contentType("application/json")
                        .content("{\"role\":\"MANAGER\",\"assignedHotelId\":null}"))
                .andExpect(status().isBadRequest());
    }

    @Test void staffEmailIsNormalizedAndDuplicateIsRejected() throws Exception {
        create("manager@lankastay.lk", StaffRole.MANAGER, StaffStatus.ACTIVE, false);
        MvcResult login = login("manager@lankastay.lk", PASSWORD).andReturn();
        String first = createStaffJson("HOTEL_STAFF").replace("new.staff@lankastay.lk", "  NEW.STAFF@LANKASTAY.LK  ");
        mvc.perform(post("/api/v1/admin/staff").session(session(login)).with(csrf()).contentType("application/json").content(first))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.staff.email").value("new.staff@lankastay.lk"));
        mvc.perform(post("/api/v1/admin/staff").session(session(login)).with(csrf()).contentType("application/json").content(createStaffJson("HOTEL_STAFF")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("An account already exists with this email."));
    }

    @Test void logoutInvalidatesSessionAndProtectedEndpointRejectsAnonymous() throws Exception {
        create("logout@lankastay.lk", StaffRole.HOTEL_STAFF, StaffStatus.ACTIVE, false);
        MvcResult login = login("logout@lankastay.lk", PASSWORD).andReturn();
        org.springframework.mock.web.MockHttpSession authenticatedSession = session(login);
        mvc.perform(post("/api/v1/auth/logout").session(authenticatedSession).with(csrf())).andExpect(status().isNoContent());
        assertThat(authenticatedSession.isInvalid()).isTrue();
        mvc.perform(get("/api/management/destinations")).andExpect(status().isUnauthorized());
    }

    @Test void disablingLoggedInUserBlocksTheNextRequest() throws Exception {
        StaffUser user = create("active@lankastay.lk", StaffRole.HOTEL_STAFF, StaffStatus.ACTIVE, false);
        MvcResult login = login(user.getEmail(), PASSWORD).andReturn();
        user.setStatus(StaffStatus.DISABLED);
        users.saveAndFlush(user);
        mvc.perform(get("/api/v1/auth/me").session(session(login))).andExpect(status().isUnauthorized());
    }

    @Test void repeatedFailuresCauseTemporaryAccountLockoutAndAudit() throws Exception {
        StaffUser user = create("lockout@lankastay.lk", StaffRole.HOTEL_STAFF, StaffStatus.ACTIVE, false);
        for (int i = 0; i < 5; i++) login(user.getEmail(), "wrong password value").andExpect(status().isUnauthorized());
        StaffUser locked = users.findById(user.getId()).orElseThrow();
        assertThat(locked.getLockedUntil()).isAfter(java.time.Instant.now());
        login(user.getEmail(), PASSWORD).andExpect(status().isUnauthorized());
        assertThat(audits.findAll()).extracting(SecurityAudit::getEventType).contains(SecurityEventType.ACCOUNT_LOCKED, SecurityEventType.LOGIN_FAILURE);
    }

    @Test void managerCanResetPasswordAndOldCredentialStopsWorking() throws Exception {
        StaffUser manager = create("manager@lankastay.lk", StaffRole.MANAGER, StaffStatus.ACTIVE, false);
        StaffUser target = create("reset@lankastay.lk", StaffRole.HOTEL_STAFF, StaffStatus.ACTIVE, false);
        MvcResult login = login(manager.getEmail(), PASSWORD).andReturn();
        mvc.perform(post("/api/v1/admin/staff/" + target.getId() + "/reset-password").session(session(login)).with(csrf()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.temporaryPassword").isString()).andExpect(jsonPath("$.mustChangePassword").value(true));
        login(target.getEmail(), PASSWORD).andExpect(status().isUnauthorized());
        assertThat(audits.findAll()).extracting(SecurityAudit::getEventType).contains(SecurityEventType.PASSWORD_RESET_BY_ADMIN);
    }

    @Test void bootstrapManagerRequiresExplicitEnvironmentCredentials() {
        assertThat(users.existsByRole(StaffRole.MANAGER)).isFalse();
    }

    @Test void csrfIsRequiredForLogin() throws Exception {
        create("csrf@lankastay.lk", StaffRole.HOTEL_STAFF, StaffStatus.ACTIVE, false);
        mvc.perform(post("/api/v1/auth/login").contentType("application/json")
                        .content("{\"email\":\"csrf@lankastay.lk\",\"password\":\"" + PASSWORD + "\"}"))
                .andExpect(status().isForbidden());
        login("csrf@lankastay.lk", PASSWORD).andExpect(status().isOk());
    }

    @Test void credentialedCorsAllowsConfiguredLocalOriginButRejectsUnknownOrigin() throws Exception {
        mvc.perform(options("/api/v1/auth/login")
                        .header("Origin", "http://localhost:5174")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type,x-xsrf-token"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5174"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));

        mvc.perform(options("/api/v1/auth/login")
                        .header("Origin", "https://untrusted.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    private StaffUser create(String email, StaffRole role, StaffStatus status, boolean mustChange) {
        StaffUser user = new StaffUser();
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(role);
        user.setStatus(status);
        user.setAssignedHotelId(role == StaffRole.MANAGER ? null : 301L);
        user.setMustChangePassword(mustChange);
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

    private String createStaffJson(String role) {
        return "{\"firstName\":\"New\",\"lastName\":\"Staff\",\"email\":\"new.staff@lankastay.lk\",\"jobTitle\":\"Hotel Staff\",\"role\":\"" + role + "\",\"assignedHotelId\":301}";
    }
}
