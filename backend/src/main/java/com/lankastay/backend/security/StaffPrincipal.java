package com.lankastay.backend.security;

import com.lankastay.backend.entity.StaffStatus;
import com.lankastay.backend.entity.StaffUser;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public record StaffPrincipal(
        UUID id, String username, String password, String role, StaffStatus status,
        boolean mustChangePassword, Instant lockedUntil, Long assignedHotelId,
        String firstName, String lastName
) implements UserDetails {
    public static StaffPrincipal from(StaffUser user) {
        return new StaffPrincipal(user.getId(), user.getEmail(), user.getPasswordHash(), user.getRole().name(),
                user.getStatus(), user.isMustChangePassword(), user.getLockedUntil(),
                user.getAssignedHotelId(), user.getFirstName(), user.getLastName());
    }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }
    @Override public String getUsername() { return username; }
    @Override public String getPassword() { return password; }
    @Override public boolean isAccountNonLocked() {
        return status != StaffStatus.LOCKED && (lockedUntil == null || !lockedUntil.isAfter(Instant.now()));
    }
    @Override public boolean isEnabled() { return status == StaffStatus.ACTIVE; }
    @Override public String toString() {
        return "StaffPrincipal[id=" + id + ", username=" + username + ", password=<redacted>, role=" + role
                + ", status=" + status + ", mustChangePassword=" + mustChangePassword + "]";
    }
}
