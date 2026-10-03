package com.lankastay.backend.controller;

import com.lankastay.backend.dto.staff.*;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.StaffAdministrationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/staff")
@PreAuthorize("hasRole('MANAGER')")
public class StaffAdministrationController {
    private final StaffAdministrationService service;
    public StaffAdministrationController(StaffAdministrationService service) { this.service = service; }

    @GetMapping public List<StaffResponse> list() { return service.list(); }
    @GetMapping("/{id}") public StaffResponse get(@PathVariable UUID id) { return service.get(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProvisionedStaffResponse create(@Valid @RequestBody CreateStaffRequest request,
            @AuthenticationPrincipal StaffPrincipal actor, HttpServletRequest servletRequest) {
        return service.create(request, actor.id(), servletRequest.getRemoteAddr());
    }

    @PatchMapping("/{id}")
    public StaffResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateStaffRequest request,
            @AuthenticationPrincipal StaffPrincipal actor, HttpServletRequest servletRequest) {
        return service.update(id, request, actor.id(), servletRequest.getRemoteAddr());
    }

    @PatchMapping("/{id}/status")
    public StaffResponse updateStatus(@PathVariable UUID id, @Valid @RequestBody UpdateStaffStatusRequest request,
            @AuthenticationPrincipal StaffPrincipal actor, HttpServletRequest servletRequest) {
        return service.updateStatus(id, request, actor.id(), servletRequest.getRemoteAddr());
    }

    @PostMapping("/{id}/reset-password")
    public ResetStaffPasswordResponse reset(@PathVariable UUID id,
            @AuthenticationPrincipal StaffPrincipal actor, HttpServletRequest servletRequest) {
        return service.resetPassword(id, actor.id(), servletRequest.getRemoteAddr());
    }
}
