package com.lankastay.backend.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Set;

/** Explicit 404 tombstones; no controller, DTO, or password mutation remains. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RetiredPasswordResetFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        boolean retired = Set.of("/api/v1/auth", "/api/v1/customer/auth").stream().anyMatch(prefix ->
                path.equals(prefix + "/forgot-password/change-password")
                        || path.equals(prefix + "/forgot-password/check-email")
                        || path.equals(prefix + "/dev-last-reset-link"));
        if (retired) { response.setStatus(404); return; }
        chain.doFilter(request, response);
    }
}
