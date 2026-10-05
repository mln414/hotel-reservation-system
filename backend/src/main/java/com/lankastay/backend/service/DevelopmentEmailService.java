package com.lankastay.backend.service;

import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

/** Local delivery through the private developer console, never an HTTP token lookup. */
@Service
@Profile("dev")
public class DevelopmentEmailService implements EmailService {
    public void sendPasswordReset(String email, String resetUrl) {
        LoggerFactory.getLogger(getClass()).info("Development-only password reset for {}: {}", email, resetUrl);
    }
}
