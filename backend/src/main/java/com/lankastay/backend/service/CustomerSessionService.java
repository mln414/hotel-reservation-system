package com.lankastay.backend.service;

import com.lankastay.backend.entity.CustomerUser;
import com.lankastay.backend.exception.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class CustomerSessionService {
    public static final String CUSTOMER_SESSION_KEY = "LANKASTAY_CUSTOMER_USER";
    public static final String VERSION_SESSION_KEY = "LANKASTAY_CUSTOMER_SESSION_VERSION";
    private final CustomerAuthenticationService authenticationService;

    public CustomerSessionService(CustomerAuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    public CustomerUser requireCustomer(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        Object value = session == null ? null : session.getAttribute(CUSTOMER_SESSION_KEY);
        if (!(value instanceof String id)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "Authentication is required.");
        }
        try {
            CustomerUser customer = authenticationService.requireActive(UUID.fromString(id));
            Object version = session.getAttribute(VERSION_SESSION_KEY);
            // Legacy sessions created before versioning are valid only until the first reset.
            long sessionVersion = version instanceof Long number ? number : 0;
            if (sessionVersion != customer.getSessionVersion()) {
                session.invalidate();
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "Authentication is required.");
            }
            return customer;
        } catch (IllegalArgumentException invalidSession) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Unauthorized", "Authentication is required.");
        }
    }
}
