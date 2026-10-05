package com.lankastay.backend.controller;

import com.lankastay.backend.dto.staff.StaffResponse;
import com.lankastay.backend.dto.staff.UpdateProfileRequest;
import com.lankastay.backend.entity.StaffUser;
import com.lankastay.backend.exception.ApiException;
import com.lankastay.backend.repository.StaffUserRepository;
import com.lankastay.backend.security.StaffPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/management/profile")
@PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST')")
public class StaffProfileController {
    private final StaffUserRepository userRepository;

    public StaffProfileController(StaffUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public StaffResponse getProfile(@AuthenticationPrincipal StaffPrincipal actor) {
        StaffUser user = userRepository.findById(actor.id())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "User profile not found."));
        return StaffResponse.from(user);
    }

    @PutMapping
    public StaffResponse updateProfile(@AuthenticationPrincipal StaffPrincipal actor,
                                        @Valid @RequestBody UpdateProfileRequest request) {
        StaffUser user = userRepository.findById(actor.id())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Not Found", "User profile not found."));

        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        if (request.phone() != null) {
            user.setPhone(request.phone().trim());
        }

        userRepository.save(user);
        return StaffResponse.from(user);
    }
}
