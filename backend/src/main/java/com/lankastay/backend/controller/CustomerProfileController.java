package com.lankastay.backend.controller;

import com.lankastay.backend.dto.auth.CustomerChangePasswordRequest;
import com.lankastay.backend.dto.auth.CustomerResponse;
import com.lankastay.backend.dto.auth.MessageResponse;
import com.lankastay.backend.dto.auth.UpdateCustomerProfileRequest;
import com.lankastay.backend.entity.CustomerUser;
import com.lankastay.backend.service.CustomerAuthenticationService;
import com.lankastay.backend.service.CustomerSessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/customer/profile")
public class CustomerProfileController {

    private final CustomerSessionService customerSessionService;
    private final CustomerAuthenticationService customerAuthService;

    public CustomerProfileController(CustomerSessionService customerSessionService,
                                     CustomerAuthenticationService customerAuthService) {
        this.customerSessionService = customerSessionService;
        this.customerAuthService = customerAuthService;
    }

    @GetMapping
    public ResponseEntity<CustomerResponse> getProfile(HttpServletRequest servletRequest) {
        CustomerUser customer = customerSessionService.requireCustomer(servletRequest);
        return ResponseEntity.ok(CustomerResponse.from(customer));
    }

    @PutMapping
    public ResponseEntity<CustomerResponse> updateProfile(
            @Valid @RequestBody UpdateCustomerProfileRequest request,
            HttpServletRequest servletRequest
    ) {
        CustomerUser customer = customerSessionService.requireCustomer(servletRequest);
        CustomerResponse response = customerAuthService.updateProfile(customer.getId(), request, clientIp(servletRequest));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<MessageResponse> changePassword(
            @Valid @RequestBody CustomerChangePasswordRequest request,
            HttpServletRequest servletRequest
    ) {
        CustomerUser customer = customerSessionService.requireCustomer(servletRequest);
        customerAuthService.changePassword(customer.getId(), request, clientIp(servletRequest));
        return ResponseEntity.ok(new MessageResponse("Password changed successfully."));
    }

    private String clientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }
}
