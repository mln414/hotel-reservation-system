package com.lankastay.backend.security;

import com.lankastay.backend.entity.StaffRole;

import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

public enum Permission {
    DASHBOARD_VIEW("Dashboard", "View operational overview & analytics"),
    PROPERTY_VIEW("Property View", "View property details & configuration"),
    PROPERTY_EDIT("Property Edit", "Edit assigned property operational content"),
    PROPERTY_ACTIVATE("Property Activation", "Activate or deactivate hotel listings"),
    PROPERTY_DELETE("Property Deletion", "Delete hotel records permanently"),
    ROOMS_MANAGE("Rooms & Amenities", "Manage room categories, pricing, & amenities"),
    RESERVATIONS_VIEW("Reservations View", "Search and view reservation records"),
    RESERVATIONS_MANAGE("Reservations Manage", "Manage bookings, check-in, check-out & assignments"),
    AVAILABILITY_MANAGE("Availability Control", "Update room availability & inventory"),
    RATES_MANAGE("Rates & Plans", "Manage rate plans and promotional pricing"),
    OFFERS_MANAGE("Offers & Discounts", "Create and manage promotional offers"),
    REVIEWS_MANAGE("Guest Reviews", "Moderate guest reviews and responses"),
    STAFF_MANAGE("Staff Management", "Create, manage access, and reset staff accounts"),
    STATUS_MANAGE("System Status", "View system status & security audit logs");

    private final String label;
    private final String description;

    Permission(String label, String description) {
        this.label = label;
        this.description = description;
    }

    public String getLabel() { return label; }
    public String getDescription() { return description; }

    public static Set<Permission> getDefaultPermissionsForRole(StaffRole role) {
        if (role == null) return EnumSet.noneOf(Permission.class);
        return switch (role) {
            case MANAGER -> EnumSet.allOf(Permission.class);
            case HOTEL_STAFF -> EnumSet.of(
                    DASHBOARD_VIEW, PROPERTY_VIEW, PROPERTY_EDIT, ROOMS_MANAGE,
                    RESERVATIONS_VIEW, AVAILABILITY_MANAGE, RATES_MANAGE, OFFERS_MANAGE, REVIEWS_MANAGE
            );
            case RECEPTIONIST -> EnumSet.of(
                    DASHBOARD_VIEW, PROPERTY_VIEW, RESERVATIONS_VIEW, RESERVATIONS_MANAGE, AVAILABILITY_MANAGE
            );
        };
    }

    public static Set<Permission> getMaxAllowedPermissionsForRole(StaffRole role) {
        if (role == null) return EnumSet.noneOf(Permission.class);
        return switch (role) {
            case MANAGER -> EnumSet.allOf(Permission.class);
            case HOTEL_STAFF -> EnumSet.complementOf(EnumSet.of(PROPERTY_ACTIVATE, PROPERTY_DELETE, STAFF_MANAGE));
            case RECEPTIONIST -> EnumSet.of(
                    DASHBOARD_VIEW, PROPERTY_VIEW, RESERVATIONS_VIEW, RESERVATIONS_MANAGE,
                    AVAILABILITY_MANAGE, ROOMS_MANAGE, RATES_MANAGE, OFFERS_MANAGE, REVIEWS_MANAGE
            );
        };
    }

    public static Set<Permission> sanitizeForRole(StaffRole role, Set<Permission> requested) {
        Set<Permission> allowedCeiling = getMaxAllowedPermissionsForRole(role);
        if (requested == null || requested.isEmpty()) {
            return getDefaultPermissionsForRole(role);
        }
        return requested.stream()
                .filter(allowedCeiling::contains)
                .collect(Collectors.toSet());
    }
}
