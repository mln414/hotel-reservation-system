package com.lankastay.backend.controller;

import com.lankastay.backend.dto.auth.*;
import com.lankastay.backend.entity.CustomerUser;
import com.lankastay.backend.entity.SecurityEventType;
import com.lankastay.backend.service.CustomerAuthenticationService;
import com.lankastay.backend.service.SecurityAuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/customer/auth")
public class CustomerAuthenticationController {

    private final CustomerAuthenticationService customerAuthService;
    private final SecurityAuditService audit;
    private final com.lankastay.backend.service.CustomerSessionService customerSessions;

    public CustomerAuthenticationController(CustomerAuthenticationService customerAuthService, SecurityAuditService audit,
            com.lankastay.backend.service.CustomerSessionService customerSessions) {
        this.customerAuthService = customerAuthService;
        this.audit = audit;
        this.customerSessions = customerSessions;
    }

    @PostMapping("/register")
    public ResponseEntity<CustomerResponse> register(
            @Valid @RequestBody CustomerRegisterRequest request,
            HttpServletRequest servletRequest
    ) {
        CustomerResponse response = customerAuthService.register(request, clientIp(servletRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<CustomerResponse> login(
            @Valid @RequestBody CustomerLoginRequest request,
            HttpServletRequest servletRequest
    ) {
        CustomerUser customer = customerAuthService.login(request, clientIp(servletRequest));

        HttpSession session = servletRequest.getSession(true);
        try {
            servletRequest.changeSessionId();
        } catch (IllegalStateException ignored) {
            // Already new or container does not support changeSessionId
        }
        session.setAttribute(com.lankastay.backend.service.CustomerSessionService.CUSTOMER_SESSION_KEY, customer.getId().toString());
        session.setAttribute(com.lankastay.backend.service.CustomerSessionService.VERSION_SESSION_KEY, customer.getSessionVersion());

        return ResponseEntity.ok(CustomerResponse.from(customer));
    }

    @GetMapping("/me")
    public ResponseEntity<CustomerResponse> me(HttpServletRequest servletRequest) {
        CustomerUser customer = customerSessions.requireCustomer(servletRequest);
        return ResponseEntity.ok(CustomerResponse.from(customer));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest servletRequest) {
        HttpSession session = servletRequest.getSession(false);
        if (session != null) {
            String idStr = (String) session.getAttribute(com.lankastay.backend.service.CustomerSessionService.CUSTOMER_SESSION_KEY);
            if (idStr != null) {
                audit.record(java.util.UUID.fromString(idStr), java.util.UUID.fromString(idStr), SecurityEventType.LOGOUT, clientIp(servletRequest), "SUCCESS");
            }
            session.invalidate();
        }
        return ResponseEntity.noContent().build();
    }

    private String clientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
}
