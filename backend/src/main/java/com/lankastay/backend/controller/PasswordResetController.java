package com.lankastay.backend.controller;

import com.lankastay.backend.dto.auth.*;
import com.lankastay.backend.service.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
public class PasswordResetController {
    private final PasswordResetService service;
    public PasswordResetController(PasswordResetService service) { this.service = service; }
    @PostMapping("/api/v1/auth/forgot-password")
    public MessageResponse staffRequest(@Valid @RequestBody ForgotPasswordRequest body, HttpServletRequest request) {
        return new MessageResponse(service.requestPasswordReset(body, request.getRemoteAddr(), false));
    }
    @PostMapping("/api/v1/customer/auth/forgot-password")
    public MessageResponse customerRequest(@Valid @RequestBody ForgotPasswordRequest body, HttpServletRequest request) {
        return new MessageResponse(service.requestPasswordReset(body, request.getRemoteAddr(), true));
    }
    @PostMapping("/api/v1/auth/reset-password")
    public MessageResponse staffReset(@Valid @RequestBody ResetPasswordRequest body, HttpServletRequest request) {
        service.resetPassword(body, request.getRemoteAddr(), false);
        return success();
    }
    @PostMapping("/api/v1/customer/auth/reset-password")
    public MessageResponse customerReset(@Valid @RequestBody ResetPasswordRequest body, HttpServletRequest request) {
        service.resetPassword(body, request.getRemoteAddr(), true);
        return success();
    }
    private MessageResponse success() {
        return new MessageResponse("Password has been reset successfully. You may now log in with your new password.");
    }
}
