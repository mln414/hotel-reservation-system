package com.lankastay.backend;

import com.lankastay.backend.dto.auth.ChangeInitialPasswordRequest;
import com.lankastay.backend.dto.auth.ChangePasswordRequest;
import com.lankastay.backend.dto.auth.CsrfTokenResponse;
import com.lankastay.backend.dto.auth.CustomerChangePasswordRequest;
import com.lankastay.backend.dto.auth.CustomerLoginRequest;
import com.lankastay.backend.dto.auth.CustomerRegisterRequest;
import com.lankastay.backend.dto.auth.ResetPasswordRequest;
import com.lankastay.backend.dto.auth.StaffLoginRequest;
import com.lankastay.backend.dto.staff.ProvisionedStaffResponse;
import com.lankastay.backend.dto.staff.ResetStaffPasswordResponse;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class SensitiveDtoLoggingTest {
    @Test
    void authenticationSecretsAreRedactedFromStringRepresentations() {
        String secret = "unique-secret-that-must-not-appear";

        assertThat(new StaffLoginRequest("staff@example.invalid", secret).toString()).doesNotContain(secret);
        assertThat(new ChangeInitialPasswordRequest(secret, secret, secret).toString()).doesNotContain(secret);
        assertThat(new ChangePasswordRequest(secret, secret, secret).toString()).doesNotContain(secret);
        assertThat(new CsrfTokenResponse(secret, "X-XSRF-TOKEN").toString()).doesNotContain(secret);
        assertThat(new ProvisionedStaffResponse(null, secret).toString()).doesNotContain(secret);
        assertThat(new ResetStaffPasswordResponse(UUID.randomUUID(), secret, true).toString()).doesNotContain(secret);
        assertThat(new CustomerLoginRequest("customer@example.invalid", secret).toString()).doesNotContain(secret);
        assertThat(new CustomerRegisterRequest("Test", "Guest", "customer@example.invalid", null, secret).toString()).doesNotContain(secret);
        assertThat(new CustomerChangePasswordRequest(secret, secret, secret).toString()).doesNotContain(secret);
        assertThat(new ResetPasswordRequest(secret, secret, secret).toString()).doesNotContain(secret);
    }
}
