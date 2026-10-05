package com.lankastay.backend;

import com.lankastay.backend.entity.StaffRole;
import com.lankastay.backend.entity.StaffStatus;
import com.lankastay.backend.entity.StaffUser;
import com.lankastay.backend.repository.StaffUserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class BootstrapManagerIntegrationTest {
    private static final String EMAIL = "bootstrap.manager@lankastay.invalid";
    private static final String TEMPORARY_PASSWORD = "Bootstrap1!" + UUID.randomUUID();
    private static final String DATABASE_NAME = "bootstrap_" + UUID.randomUUID().toString().replace("-", "");

    @DynamicPropertySource
    static void bootstrapProperties(DynamicPropertyRegistry properties) {
        properties.add("spring.datasource.url",
                () -> "jdbc:h2:mem:" + DATABASE_NAME + ";MODE=MySQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE");
        properties.add("lankastay.security.bootstrap-admin-email", () -> EMAIL);
        properties.add("lankastay.security.bootstrap-admin-temp-password", () -> TEMPORARY_PASSWORD);
    }

    @Autowired StaffUserRepository users;
    @Autowired PasswordEncoder encoder;
    @Autowired MockMvc mvc;

    @Test
    void explicitBootstrapCredentialCreatesActiveManagerAndRequiresInitialPasswordChange() throws Exception {
        StaffUser manager = users.findByEmail(EMAIL).orElseThrow();
        assertThat(manager.getRole()).isEqualTo(StaffRole.MANAGER);
        assertThat(manager.getStatus()).isEqualTo(StaffStatus.ACTIVE);
        assertThat(manager.isMustChangePassword()).isTrue();
        // Security: verification uses PasswordEncoder.matches(); neither credential value is logged.
        assertThat(encoder.matches(TEMPORARY_PASSWORD, manager.getPasswordHash())).isTrue();

        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType("application/json")
                        .content("{\"email\":\"" + EMAIL + "\",\"password\":\"" + TEMPORARY_PASSWORD + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PASSWORD_CHANGE_REQUIRED"));

        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType("application/json")
                        .content("{\"email\":\"" + EMAIL + "\",\"password\":\"definitely-not-the-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password."));
    }
}
