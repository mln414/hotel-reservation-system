package com.lankastay.backend;

import com.lankastay.backend.entity.*;
import com.lankastay.backend.repository.*;
import com.lankastay.backend.service.EmailService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.*;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.mockito.ArgumentCaptor;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class SimpleStaffForgotPasswordIntegrationTest {
    private static final String DATABASE_NAME = "secure_reset_" + UUID.randomUUID().toString().replace("-", "");
    private static final String EMAIL = "manager.forgot@lankastay.test";
    private static final String OLD_PASSWORD = "OldPassword1!";
    private static final String NEW_PASSWORD = "NewPassword2@";
    @DynamicPropertySource static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:h2:mem:" + DATABASE_NAME + ";MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE");
    }
    @org.springframework.boot.test.context.TestConfiguration static class FastPasswordConfig {
        @Bean @Primary PasswordEncoder fastPasswordEncoder() { return new BCryptPasswordEncoder(4); }
    }
    @Autowired MockMvc mvc;
    @Autowired StaffUserRepository users;
    @Autowired PasswordResetTokenRepository tokens;
    @Autowired PasswordEncoder encoder;
    @MockitoBean EmailService email;
    @BeforeEach void setup() {
        tokens.deleteAll();
        users.deleteAll();
        StaffUser account = new StaffUser();
        account.setRole(StaffRole.MANAGER); account.setStatus(StaffStatus.ACTIVE); account.setMustChangePassword(false);
        account.setEmail(EMAIL); account.setFirstName("Forgot"); account.setLastName("User");
        account.setPasswordHash(encoder.encode(OLD_PASSWORD));
        users.saveAndFlush(account);
    }
    @Test void knownAndUnknownEmailsHaveIdenticalGenericResponse() throws Exception {
        String known = mvc.perform(post("/api/v1/auth/forgot-password").with(csrf())
                .contentType("application/json").content("{\"email\":\"" + EMAIL.toUpperCase() + "\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.exists").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        String unknown = mvc.perform(post("/api/v1/auth/forgot-password").with(csrf())
                .contentType("application/json").content("{\"email\":\"missing@lankastay.test\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(known).isEqualTo(unknown).contains("If an account exists");
        verify(email, times(1)).sendPasswordReset(eq(EMAIL), anyString());
    }
    @Test void mismatchLeavesPasswordUnchangedThenValidTokenReplacesHashAndLoginCredential() throws Exception {
        String before = users.findByEmail(EMAIL).orElseThrow().getPasswordHash();
        mvc.perform(post("/api/v1/auth/forgot-password").with(csrf()).contentType("application/json")
                .content("{\"email\":\"" + EMAIL + "\"}")).andExpect(status().isOk());
        ArgumentCaptor<String> link = ArgumentCaptor.forClass(String.class);
        verify(email).sendPasswordReset(eq(EMAIL), link.capture());
        String raw = link.getValue().split("token=")[1];
        mvc.perform(post("/api/v1/auth/reset-password").with(csrf()).contentType("application/json")
                .content("{\"token\":\"" + raw + "\",\"newPassword\":\"" + NEW_PASSWORD + "\",\"confirmNewPassword\":\"Different3#\"}"))
                .andExpect(status().isBadRequest());
        assertThat(users.findByEmail(EMAIL).orElseThrow().getPasswordHash()).isEqualTo(before);
        mvc.perform(post("/api/v1/auth/reset-password").with(csrf()).contentType("application/json")
                .content("{\"token\":\"" + raw + "\",\"newPassword\":\"" + NEW_PASSWORD + "\",\"confirmNewPassword\":\"" + NEW_PASSWORD + "\"}"))
                .andExpect(status().isOk());
        String saved = users.findByEmail(EMAIL).orElseThrow().getPasswordHash();
        assertThat(saved).isNotEqualTo(NEW_PASSWORD).isNotEqualTo(before);
        assertThat(encoder.matches(NEW_PASSWORD, saved)).isTrue();
        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType("application/json")
                .content("{\"email\":\"" + EMAIL + "\",\"password\":\"" + OLD_PASSWORD + "\"}")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType("application/json")
                .content("{\"email\":\"" + EMAIL + "\",\"password\":\"" + NEW_PASSWORD + "\"}")).andExpect(status().isOk());
    }
}
