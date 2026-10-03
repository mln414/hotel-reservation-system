package com.lankastay.backend;

import com.lankastay.backend.dto.auth.CustomerChangePasswordRequest;
import com.lankastay.backend.dto.auth.CustomerRegisterRequest;
import com.lankastay.backend.dto.auth.ResetPasswordRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthRequestValidationTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void registrationAccepts128AndRejects129CharacterPasswords() {
        assertTrue(validator.validate(registration(passwordOfLength(128))).isEmpty());
        assertFalse(validator.validate(registration(passwordOfLength(129))).isEmpty());
    }

    @Test
    void resetAndChangeUseTheSamePasswordLengthBoundary() {
        String maximum = passwordOfLength(128);
        String overMaximum = passwordOfLength(129);
        assertTrue(validator.validate(new ResetPasswordRequest("token", maximum, maximum)).isEmpty());
        assertFalse(validator.validate(new ResetPasswordRequest("token", overMaximum, overMaximum)).isEmpty());
        assertTrue(validator.validate(new CustomerChangePasswordRequest("OldPass1!", maximum, maximum)).isEmpty());
        assertFalse(validator.validate(new CustomerChangePasswordRequest("OldPass1!", overMaximum, overMaximum)).isEmpty());
    }

    @Test
    void registrationRejectsNullEmptyAndBelowMinimumPasswords() {
        assertFalse(validator.validate(registration(null)).isEmpty());
        assertFalse(validator.validate(registration("")).isEmpty());
        assertFalse(validator.validate(registration("Aa1!bbb")).isEmpty());
        assertTrue(validator.validate(registration("Aa1!bbbb")).isEmpty());
    }

    private CustomerRegisterRequest registration(String password) {
        return new CustomerRegisterRequest("Test", "Guest", "guest@example.com", "+94 77 123 4567", password);
    }

    private String passwordOfLength(int length) {
        return "Aa1!" + "b".repeat(length - 4);
    }
}
