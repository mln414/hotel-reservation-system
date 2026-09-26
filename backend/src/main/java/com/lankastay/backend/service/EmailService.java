package com.lankastay.backend.service;

/** Reset links must never be returned by a public HTTP API. */
public interface EmailService {
    void sendPasswordReset(String email, String resetUrl);
}
