package com.lankastay.backend;

import com.lankastay.backend.dto.auth.*;
import com.lankastay.backend.entity.CustomerUser;
import com.lankastay.backend.repository.CustomerUserRepository;
import com.lankastay.backend.repository.PasswordResetTokenRepository;
import com.lankastay.backend.service.CustomerAuthenticationService;
import com.lankastay.backend.service.PasswordResetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@ActiveProfiles("dev")
public class AuthenticationPersistenceAndResetTest {

    @Autowired
    private CustomerAuthenticationService customerAuthService;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private CustomerUserRepository customerRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @org.springframework.test.context.bean.override.mockito.MockitoBean
    private com.lankastay.backend.service.EmailService emailService;

    @BeforeEach
    void setUp() {
        tokenRepository.deleteAll();
    }

    @Test
    @DisplayName("Customer registration creates real MySQL account with BCrypt password and CUSTOMER role")
    void testCustomerRegistrationSuccess() {
        String email = "qa.customer." + System.currentTimeMillis() + "@example.test";
        CustomerRegisterRequest request = new CustomerRegisterRequest(
                "Jane", "Doe", email, "0771234567", "SecurePass#2026!QA"
        );

        CustomerResponse response = customerAuthService.register(request, "127.0.0.1");

        assertNotNull(response.id());
        assertEquals("Jane", response.firstName());
        assertEquals("CUSTOMER", response.role());

        Optional<CustomerUser> savedOpt = customerRepository.findByEmail(email);
        assertTrue(savedOpt.isPresent());

        CustomerUser saved = savedOpt.get();
        assertEquals("CUSTOMER", saved.getRole());
        assertTrue(passwordEncoder.matches("SecurePass#2026!QA", saved.getPasswordHash()));
        assertNotEquals("SecurePass#2026!QA", saved.getPasswordHash()); // No plaintext storage
    }

    @Test
    @DisplayName("Privileged role assignment attempt is rejected and forced to CUSTOMER")
    void testRoleSelfAssignmentPrevented() {
        String email = "qa.hacker." + System.currentTimeMillis() + "@example.test";
        CustomerUser hacker = new CustomerUser();
        hacker.setEmail(email);
        hacker.setFirstName("Hacker");
        hacker.setLastName("User");
        hacker.setRole("MANAGER"); // Attempting privileged role set
        hacker.setPasswordHash(passwordEncoder.encode("SecurePass#2026!QA"));

        CustomerUser saved = customerRepository.save(hacker);

        assertEquals("CUSTOMER", saved.getRole()); // Verify model forces CUSTOMER
    }

    @Test
    @DisplayName("Duplicate customer registration email returns conflict")
    void testDuplicateCustomerRegistration() {
        String email = "duplicate.qa." + System.currentTimeMillis() + "@example.test";
        CustomerRegisterRequest request1 = new CustomerRegisterRequest("A", "B", email, "0711111111", "SecurePass#2026!QA");
        customerAuthService.register(request1, "127.0.0.1");

        CustomerRegisterRequest request2 = new CustomerRegisterRequest("A", "B", email.toUpperCase(), "0711111111", "SecurePass#2026!QA");
        assertThrows(RuntimeException.class, () -> customerAuthService.register(request2, "127.0.0.1"));
    }

    @Test
    @DisplayName("Password reset flow: token generation, hashing, reset, and single-use enforcement")
    void testPasswordResetFlow() {
        String email = "reset.test." + System.currentTimeMillis() + "@example.test";
        CustomerRegisterRequest reg = new CustomerRegisterRequest("Reset", "User", email, "0712345678", "OldPassword#2026!QA");
        customerAuthService.register(reg, "127.0.0.1");

        // 1. Request reset (always returns generic message)
        String genericMsg = passwordResetService.requestPasswordReset(new ForgotPasswordRequest(email), "127.0.0.1", true);
        assertEquals("If an account exists for that email, password reset instructions have been sent.", genericMsg);

        // 2. Capture delivery at the private email boundary, not through HTTP.
        org.mockito.ArgumentCaptor<String> link = org.mockito.ArgumentCaptor.forClass(String.class);
        org.mockito.Mockito.verify(emailService).sendPasswordReset(org.mockito.ArgumentMatchers.eq(email), link.capture());
        String devLink = link.getValue();
        assertNotNull(devLink);
        assertTrue(devLink.contains("token="));

        String rawToken = devLink.substring(devLink.indexOf("token=") + 6);

        // 3. Reset password
        ResetPasswordRequest resetReq = new ResetPasswordRequest(rawToken, "NewPassword#2026!Secure", "NewPassword#2026!Secure");
        assertDoesNotThrow(() -> passwordResetService.resetPassword(resetReq, "127.0.0.1", true));

        // 4. Verify new password in DB
        CustomerUser updated = customerRepository.findByEmail(email).orElseThrow();
        assertTrue(passwordEncoder.matches("NewPassword#2026!Secure", updated.getPasswordHash()));
        assertFalse(passwordEncoder.matches("OldPassword#2026!QA", updated.getPasswordHash()));

        // 5. Verify single-use token reuse fails
        assertThrows(RuntimeException.class, () -> passwordResetService.resetPassword(resetReq, "127.0.0.1", true));
    }

}
