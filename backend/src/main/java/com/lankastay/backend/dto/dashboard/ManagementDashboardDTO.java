package com.lankastay.backend.dto.dashboard;

import java.time.Instant;
import java.util.List;

public record ManagementDashboardDTO(
        DashboardScope scope,
        PortfolioKPIs portfolio,
        TodayOperations today,
        List<AttentionItem> attention,
        List<SetupPendingItem> setupPending,
        List<RecentReservationItem> recentReservations,
        List<PropertyStatusItem> propertyStatuses,
        List<RecentActivityItem> recentActivity,
        Instant generatedAt
) {
    public record DashboardScope(
            String role,
            Long propertyId,
            String propertyName
    ) {}

    public record PortfolioKPIs(
            long totalProperties,
            long activeProperties,
            long inactiveProperties,
            long pendingSetupProperties,
            long readyForReviewProperties
    ) {}

    public record TodayOperations(
            long arrivalsToday,
            long departuresToday,
            long availableRoomsToday,
            double occupancyPercentage,
            long upcomingReservations,
            long attentionRequiredCount
    ) {}

    public record AttentionItem(
            String id,
            String severity,
            String title,
            Long hotelId,
            String hotelName,
            String reason,
            String actionType,
            String actionUrl
    ) {}

    public record SetupPendingItem(
            Long hotelId,
            String name,
            int percentage,
            int missingCount,
            String primaryBlocker
    ) {}

    public record RecentReservationItem(
            String id,
            String reference,
            String guestName,
            Long hotelId,
            String hotelName,
            String checkIn,
            String checkOut,
            String status,
            String assignmentState
    ) {}

    public record PropertyStatusItem(
            Long hotelId,
            String name,
            String publicationStatus,
            String setupStatus,
            String updatedAt
    ) {}

    public record RecentActivityItem(
            Long id,
            String eventType,
            String title,
            String detailMessage,
            String occurredAt,
            String result
    ) {}
}
