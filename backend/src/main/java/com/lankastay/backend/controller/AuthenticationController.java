package com.lankastay.backend.controller;

import com.lankastay.backend.dto.auth.*;
import com.lankastay.backend.entity.SecurityEventType;
import com.lankastay.backend.entity.StaffUser;
import com.lankastay.backend.repository.StaffUserRepository;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.AuthenticationService;
import com.lankastay.backend.service.SecurityAuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {
    private final AuthenticationService authenticationService;
    private final StaffUserRepository users;
    private final SecurityContextRepository contextRepository;
    private final SessionRegistry sessionRegistry;
    private final SecurityAuditService audit;

    public AuthenticationController(AuthenticationService authenticationService, StaffUserRepository users,
            SecurityContextRepository contextRepository, SessionRegistry sessionRegistry, SecurityAuditService audit) {
        this.authenticationService = authenticationService;
        this.users = users;
        this.contextRepository = contextRepository;
        this.sessionRegistry = sessionRegistry;
        this.audit = audit;
    }

    @GetMapping("/csrf")
    public CsrfTokenResponse csrf(CsrfToken token) { return new CsrfTokenResponse(token.getToken(), token.getHeaderName()); }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody StaffLoginRequest request, HttpServletRequest servletRequest,
                               jakarta.servlet.http.HttpServletResponse servletResponse) {
        AuthenticationService.AuthenticatedLogin result = authenticationService.login(request, clientIp(servletRequest));
        if (servletRequest.getSession(false) != null) servletRequest.changeSessionId();
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(result.authentication());
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, servletRequest, servletResponse);
        sessionRegistry.registerNewSession(servletRequest.getSession().getId(), result.authentication().getPrincipal());
        String status = result.user().isMustChangePassword() ? "PASSWORD_CHANGE_REQUIRED" : "AUTHENTICATED";
        return new LoginResponse(status, CurrentUserResponse.from(result.user()));
    }

    @GetMapping("/me")
    public CurrentUserResponse me(@AuthenticationPrincipal StaffPrincipal principal) {
        return CurrentUserResponse.from(authenticationService.requireActive(principal.id()));
    }

    @PostMapping("/change-initial-password")
    public CurrentUserResponse changeInitial(@AuthenticationPrincipal StaffPrincipal principal,
            @Valid @RequestBody ChangeInitialPasswordRequest request, HttpServletRequest servletRequest,
            jakarta.servlet.http.HttpServletResponse servletResponse) {
        StaffUser user = authenticationService.changeInitialPassword(principal.id(), request, clientIp(servletRequest));

        String oldSessionId = servletRequest.getSession().getId();
        servletRequest.changeSessionId();
        StaffPrincipal refreshedPrincipal = StaffPrincipal.from(user);
        Authentication refreshedAuthentication = UsernamePasswordAuthenticationToken.authenticated(
                refreshedPrincipal, null, refreshedPrincipal.getAuthorities());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(refreshedAuthentication);
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, servletRequest, servletResponse);
        sessionRegistry.removeSessionInformation(oldSessionId);
        sessionRegistry.registerNewSession(servletRequest.getSession().getId(), refreshedPrincipal);

        return CurrentUserResponse.from(user);
    }

    @PostMapping("/change-password")
    public MessageResponse changePassword(@AuthenticationPrincipal StaffPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request, HttpServletRequest servletRequest) {
        authenticationService.changePassword(principal.id(), request, clientIp(servletRequest), servletRequest.getSession().getId());
        return new MessageResponse("Password changed successfully.");
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal StaffPrincipal principal, HttpServletRequest request) {
        audit.record(principal.id(), principal.id(), SecurityEventType.LOGOUT, clientIp(request), "SUCCESS");
        if (request.getSession(false) != null) {
            sessionRegistry.removeSessionInformation(request.getSession(false).getId());
            request.getSession(false).invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }

    private String clientIp(HttpServletRequest request) { return request.getRemoteAddr(); }
}
