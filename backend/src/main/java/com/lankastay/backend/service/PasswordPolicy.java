package com.lankastay.backend.service;

import com.lankastay.backend.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class PasswordPolicy {
    public static final int MIN_LENGTH = 8;
    public static final int MAX_LENGTH = 128;

    public void validate(String password) {
        if (password == null || password.length() < MIN_LENGTH || password.length() > MAX_LENGTH) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation Error", "Password must be between 8 and 128 characters.");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation Error", "Password must contain an uppercase letter.");
        }
        if (!password.matches(".*[a-z].*")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation Error", "Password must contain a lowercase letter.");
        }
        if (!password.matches(".*\\d.*")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation Error", "Password must contain a number.");
        }
        if (!password.matches(".*[^A-Za-z0-9\\s].*")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Validation Error", "Password must contain a special character.");
        }
    }
}
