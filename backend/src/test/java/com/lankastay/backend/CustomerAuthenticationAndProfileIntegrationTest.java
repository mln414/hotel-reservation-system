package com.lankastay.backend;

import com.lankastay.backend.dto.auth.*;
import com.lankastay.backend.entity.CustomerUser;
import com.lankastay.backend.repository.CustomerUserRepository;
import com.lankastay.backend.repository.SecurityAuditRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.json.JsonMapper;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class CustomerAuthenticationAndProfileIntegrationTest {

    @Autowired private MockMvc mvc;
    @Autowired private CustomerUserRepository customerRepository;
    @Autowired private SecurityAuditRepository auditRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private final JsonMapper objectMapper = JsonMapper.builder().build();

    private static final String PASS_A = "CustomerA#2026!Pass";
    private static final String PASS_B = "CustomerB#2026!Pass";
    private static final String NEW_PASS_A = "NewCustomerA#2026!Pass";

    private String emailA;
    private String emailB;

    @BeforeEach
    void setup() {
        long ts = System.currentTimeMillis();
        emailA = "customer_a_" + ts + "@lankastay.test";
        emailB = "customer_b_" + ts + "@lankastay.test";
    }

    @AfterEach
    void tearDown() {
        customerRepository.findByEmail(emailA).ifPresent(customerRepository::delete);
        customerRepository.findByEmail(emailB).ifPresent(customerRepository::delete);
    }

    private CustomerUser createCustomer(String email, String firstName, String lastName, String phone, String password) {
        CustomerUser customer = new CustomerUser();
        customer.setEmail(email);
        customer.setFirstName(firstName);
        customer.setLastName(lastName);
        customer.setPhone(phone);
        customer.setPasswordHash(passwordEncoder.encode(password));
        customer.setStatus("ACTIVE");
        return customerRepository.save(customer);
    }

    private MockHttpSession loginCustomer(String email, String password) throws Exception {
        CustomerLoginRequest loginReq = new CustomerLoginRequest(email, password);
        MvcResult result = mvc.perform(post("/api/v1/customer/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email.toLowerCase().trim()))
                .andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    @Test
    @DisplayName("Registration: creates account with normalized email, hashed password, and prevents duplicate registration")
    void testRegistrationLifecycle() throws Exception {
        String testEmail = "RegUser." + System.currentTimeMillis() + "@LankaStay.TEST";
        CustomerRegisterRequest req = new CustomerRegisterRequest("Kasun", "Perera", testEmail, "+94771234567", PASS_A);

        mvc.perform(post("/api/v1/customer/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.firstName").value("Kasun"))
                .andExpect(jsonPath("$.lastName").value("Perera"))
                .andExpect(jsonPath("$.email").value(testEmail.toLowerCase().trim()))
                .andExpect(jsonPath("$.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        // Duplicate registration must fail with 409 Conflict (even with different case)
        CustomerRegisterRequest dupReq = new CustomerRegisterRequest("Kasun", "Perera", testEmail.toLowerCase(), "+94771234567", PASS_A);
        mvc.perform(post("/api/v1/customer/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dupReq)))
                .andExpect(status().isConflict());

        // Cleanup
        customerRepository.findByEmail(testEmail.toLowerCase().trim()).ifPresent(customerRepository::delete);
    }

    @Test
    @DisplayName("Registration: rejects weak password violating policy")
    void testRegistrationWeakPassword() throws Exception {
        CustomerRegisterRequest weakReq = new CustomerRegisterRequest("Weak", "User", "weak@test.com", "+94771234567", "weakpass");
        mvc.perform(post("/api/v1/customer/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(weakReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Login: valid credentials authenticate, invalid/unknown credentials return generic safe message")
    void testLoginSecurity() throws Exception {
        createCustomer(emailA, "Nimal", "Silva", "+94711111111", PASS_A);

        // Valid login
        MockHttpSession session = loginCustomer(emailA, PASS_A);
        assertThat(session).isNotNull();

        // Wrong password -> 401 with generic error
        CustomerLoginRequest wrongPass = new CustomerLoginRequest(emailA, "WrongPassword#123");
        mvc.perform(post("/api/v1/customer/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongPass)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));

        // Unknown email -> 401 with same generic error
        CustomerLoginRequest unknownEmail = new CustomerLoginRequest("nonexistent@lankastay.test", PASS_A);
        mvc.perform(post("/api/v1/customer/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unknownEmail)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("Auth Hydration & Profile Ownership: Customer A and B see only their own data")
    void testCustomerProfileIsolation() throws Exception {
        CustomerUser custA = createCustomer(emailA, "CustomerA", "First", "+94711111111", PASS_A);
        CustomerUser custB = createCustomer(emailB, "CustomerB", "Second", "+94722222222", PASS_B);

        MockHttpSession sessionA = loginCustomer(emailA, PASS_A);
        MockHttpSession sessionB = loginCustomer(emailB, PASS_B);

        // GET /api/v1/customer/auth/me for A
        mvc.perform(get("/api/v1/customer/auth/me").session(sessionA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(custA.getId().toString()))
                .andExpect(jsonPath("$.firstName").value("CustomerA"))
                .andExpect(jsonPath("$.email").value(emailA.toLowerCase()));

        // GET /api/v1/customer/profile for A
        mvc.perform(get("/api/v1/customer/profile").session(sessionA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(custA.getId().toString()))
                .andExpect(jsonPath("$.firstName").value("CustomerA"));

        // GET /api/v1/customer/profile for B
        mvc.perform(get("/api/v1/customer/profile").session(sessionB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(custB.getId().toString()))
                .andExpect(jsonPath("$.firstName").value("CustomerB"));

        // Unauthenticated access returns 401
        mvc.perform(get("/api/v1/customer/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Profile Update & Mass Assignment Protection: permitted fields persist, protected fields ignored")
    void testProfileUpdateAndMassAssignment() throws Exception {
        CustomerUser custA = createCustomer(emailA, "OriginalFirst", "OriginalLast", "+94711111111", PASS_A);
        CustomerUser custB = createCustomer(emailB, "TargetB", "User", "+94722222222", PASS_B);

        MockHttpSession sessionA = loginCustomer(emailA, PASS_A);

        // Normal profile update
        UpdateCustomerProfileRequest updateReq = new UpdateCustomerProfileRequest("UpdatedFirst", "UpdatedLast", "+94799999999", emailA);
        mvc.perform(put("/api/v1/customer/profile")
                        .session(sessionA)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("UpdatedFirst"))
                .andExpect(jsonPath("$.lastName").value("UpdatedLast"))
                .andExpect(jsonPath("$.phone").value("+94799999999"));

        // Verify MySQL persistence
        CustomerUser inDb = customerRepository.findById(custA.getId()).orElseThrow();
        assertThat(inDb.getFirstName()).isEqualTo("UpdatedFirst");
        assertThat(inDb.getLastName()).isEqualTo("UpdatedLast");
        assertThat(inDb.getPhone()).isEqualTo("+94799999999");

        // Mass assignment attack: attempt to escalate role to MANAGER, change ID, change passwordHash
        Map<String, Object> maliciousPayload = Map.of(
                "firstName", "HackedFirst",
                "lastName", "HackedLast",
                "role", "MANAGER",
                "id", custB.getId().toString(),
                "passwordHash", "hackedHash123",
                "status", "DISABLED"
        );
        mvc.perform(put("/api/v1/customer/profile")
                        .session(sessionA)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(maliciousPayload)))
                .andExpect(status().isOk());

        CustomerUser safeUser = customerRepository.findById(custA.getId()).orElseThrow();
        assertThat(safeUser.getRole()).isEqualTo("CUSTOMER"); // Role NOT escalated
        assertThat(safeUser.getId()).isEqualTo(custA.getId()); // ID NOT changed
        assertThat(safeUser.getStatus()).isEqualTo("ACTIVE"); // Status NOT changed
        assertThat(passwordEncoder.matches(PASS_A, safeUser.getPasswordHash())).isTrue(); // Password hash NOT corrupted

        // Attempt duplicate email collision: Customer A tries changing email to Customer B's email
        UpdateCustomerProfileRequest dupEmailReq = new UpdateCustomerProfileRequest("Kasun", "Silva", "+94711111111", emailB);
        mvc.perform(put("/api/v1/customer/profile")
                        .session(sessionA)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dupEmailReq)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Password Change: validates current password, enforces policy, updates hash, old pass fails")
    void testCustomerPasswordChangeLifecycle() throws Exception {
        CustomerUser custA = createCustomer(emailA, "PassTest", "User", "+94711111111", PASS_A);
        MockHttpSession sessionA = loginCustomer(emailA, PASS_A);

        // 1. Wrong current password -> 400 Bad Request
        CustomerChangePasswordRequest wrongCurrentReq = new CustomerChangePasswordRequest("WrongPass#12345", NEW_PASS_A, NEW_PASS_A);
        mvc.perform(post("/api/v1/customer/profile/change-password")
                        .session(sessionA)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongCurrentReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Current password is incorrect."));

        // 2. New password same as current -> 400 Bad Request
        CustomerChangePasswordRequest samePassReq = new CustomerChangePasswordRequest(PASS_A, PASS_A, PASS_A);
        mvc.perform(post("/api/v1/customer/profile/change-password")
                        .session(sessionA)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(samePassReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("New password must be different from current password."));

        // 3. New password violates policy (no special char) -> 400 Bad Request
        CustomerChangePasswordRequest weakPassReq = new CustomerChangePasswordRequest(PASS_A, "WeakNewPassword1", "WeakNewPassword1");
        mvc.perform(post("/api/v1/customer/profile/change-password")
                        .session(sessionA)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(weakPassReq)))
                .andExpect(status().isBadRequest());

        // 4. Successful password change
        CustomerChangePasswordRequest successReq = new CustomerChangePasswordRequest(PASS_A, NEW_PASS_A, NEW_PASS_A);
        mvc.perform(post("/api/v1/customer/profile/change-password")
                        .session(sessionA)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(successReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully."));

        // 5. Old password no longer authenticates
        CustomerLoginRequest oldLogin = new CustomerLoginRequest(emailA, PASS_A);
        mvc.perform(post("/api/v1/customer/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(oldLogin)))
                .andExpect(status().isUnauthorized());

        // 6. New password authenticates successfully
        loginCustomer(emailA, NEW_PASS_A);
    }

    @Test
    @DisplayName("Logout & Session Invalidation: logged out session cannot access protected endpoints")
    void testLogoutSessionInvalidation() throws Exception {
        createCustomer(emailA, "Logout", "User", "+94711111111", PASS_A);
        MockHttpSession sessionA = loginCustomer(emailA, PASS_A);

        // Profile accessible before logout
        mvc.perform(get("/api/v1/customer/profile").session(sessionA))
                .andExpect(status().isOk());

        // Logout
        mvc.perform(post("/api/v1/customer/auth/logout").session(sessionA).with(csrf()))
                .andExpect(status().isNoContent());

        // Profile request with invalidated session must return 401
        mvc.perform(get("/api/v1/customer/profile").session(sessionA))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Customer cannot access Staff Management endpoints")
    void testCustomerCannotAccessStaffManagementEndpoints() throws Exception {
        createCustomer(emailA, "Customer", "Regular", "+94711111111", PASS_A);
        MockHttpSession sessionA = loginCustomer(emailA, PASS_A);

        // Attempt to access Management Hotels -> 401/403
        mvc.perform(get("/api/v1/hotels").session(sessionA))
                .andExpect(status().isUnauthorized());

        // Attempt to access Management Staff -> 401/403
        mvc.perform(get("/api/v1/admin/staff").session(sessionA))
                .andExpect(status().isUnauthorized());

        // Attempt to access Management Reviews -> 401/403
        mvc.perform(get("/api/v1/management/reviews").session(sessionA))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("CSRF Protection: mutations without CSRF token are rejected with 403 Forbidden")
    void testCsrfProtectionOnCustomerMutations() throws Exception {
        createCustomer(emailA, "Csrf", "Test", "+94711111111", PASS_A);
        MockHttpSession sessionA = loginCustomer(emailA, PASS_A);

        UpdateCustomerProfileRequest updateReq = new UpdateCustomerProfileRequest("NoCsrf", "Test", "+94711111111", emailA);

        // Mutation without CSRF -> 403 Forbidden
        mvc.perform(put("/api/v1/customer/profile")
                        .session(sessionA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Password reset development helper is unavailable outside the dev profile")
    void testPasswordResetDevelopmentHelperIsDisabledByDefault() throws Exception {
        mvc.perform(get("/api/v1/auth/dev-last-reset-link"))
                .andExpect(status().isNotFound());
    }
}
