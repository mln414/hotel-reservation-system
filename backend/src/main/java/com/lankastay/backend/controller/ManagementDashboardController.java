package com.lankastay.backend.controller;

import com.lankastay.backend.dto.dashboard.ManagementDashboardDTO;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.ManagementDashboardService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/management/dashboard")
public class ManagementDashboardController {

    private final ManagementDashboardService dashboardService;

    public ManagementDashboardController(ManagementDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'HOTEL_STAFF', 'RECEPTIONIST')")
    public ManagementDashboardDTO getDashboard(
            @RequestParam(required = false) Long hotelId,
            @AuthenticationPrincipal StaffPrincipal principal
    ) {
        return dashboardService.getDashboardData(hotelId, principal);
    }
}
