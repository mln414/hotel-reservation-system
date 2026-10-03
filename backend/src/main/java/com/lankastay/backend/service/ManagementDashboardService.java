package com.lankastay.backend.service;

import com.lankastay.backend.dto.dashboard.ManagementDashboardDTO;
import com.lankastay.backend.entity.Hotel;
import com.lankastay.backend.entity.HotelStatus;
import com.lankastay.backend.entity.Reservation;
import com.lankastay.backend.entity.SecurityAudit;
import com.lankastay.backend.entity.StaffRole;
import com.lankastay.backend.repository.HotelRepository;
import com.lankastay.backend.repository.ReservationRepository;
import com.lankastay.backend.repository.RoomRepository;
import com.lankastay.backend.repository.SecurityAuditRepository;
import com.lankastay.backend.security.StaffPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class ManagementDashboardService {

    private final HotelRepository hotelRepository;
    private final SecurityAuditRepository securityAuditRepository;
    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final com.lankastay.backend.repository.ReservationItemRepository reservationItemRepository;

    public ManagementDashboardService(
            HotelRepository hotelRepository,
            SecurityAuditRepository securityAuditRepository,
            ReservationRepository reservationRepository,
            RoomRepository roomRepository,
            com.lankastay.backend.repository.ReservationItemRepository reservationItemRepository
    ) {
        this.hotelRepository = hotelRepository;
        this.securityAuditRepository = securityAuditRepository;
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
        this.reservationItemRepository = reservationItemRepository;
    }

    @Transactional(readOnly = true)
    public ManagementDashboardDTO getDashboardData(Long filterHotelId, StaffPrincipal principal) {
        String role = principal.role();
        Long effectiveHotelId = null;
        String propertyName = null;

        if ("MANAGER".equalsIgnoreCase(role)) {
            if (filterHotelId != null) {
                effectiveHotelId = filterHotelId;
            }
        } else {
            effectiveHotelId = principal.assignedHotelId();
        }

        List<Hotel> allHotels = hotelRepository.findAll();
        List<Hotel> scopedHotels;

        if (effectiveHotelId != null) {
            Long targetId = effectiveHotelId;
            scopedHotels = allHotels.stream()
                    .filter(h -> Objects.equals(h.getId(), targetId))
                    .toList();
            propertyName = scopedHotels.stream()
                    .findFirst()
                    .map(Hotel::getName)
                    .orElse("Assigned Property");
        } else {
            scopedHotels = allHotels;
        }

        long totalProperties = scopedHotels.size();
        long activeProperties = scopedHotels.stream()
                .filter(h -> HotelStatus.PUBLICATION_ACTIVE.equalsIgnoreCase(h.getPublicationStatus()))
                .count();
        long inactiveProperties = totalProperties - activeProperties;
        long pendingSetupProperties = scopedHotels.stream()
                .filter(h -> HotelStatus.SETUP_PENDING.equalsIgnoreCase(h.getSetupStatus()))
                .count();
        long readyForReviewProperties = scopedHotels.stream()
                .filter(h -> HotelStatus.SETUP_COMPLETE.equalsIgnoreCase(h.getSetupStatus())
                        && !HotelStatus.PUBLICATION_ACTIVE.equalsIgnoreCase(h.getPublicationStatus()))
                .count();

        ManagementDashboardDTO.PortfolioKPIs portfolioKPIs = new ManagementDashboardDTO.PortfolioKPIs(
                totalProperties,
                activeProperties,
                inactiveProperties,
                pendingSetupProperties,
                readyForReviewProperties
        );

        LocalDate today = LocalDate.now();
        List<Reservation> allReservations = effectiveHotelId != null
                ? reservationRepository.findByHotelId(effectiveHotelId)
                : reservationRepository.findAll();

        long arrivalsToday = allReservations.stream()
                .filter(r -> today.equals(r.getCheckIn()) && r.getReservationStatus() == com.lankastay.backend.entity.ReservationStatus.CONFIRMED)
                .count();
        long departuresToday = allReservations.stream()
                .filter(r -> today.equals(r.getCheckOut()) && r.getReservationStatus() == com.lankastay.backend.entity.ReservationStatus.CONFIRMED)
                .count();
        List<Long> activeHotelIds = scopedHotels.stream()
                .filter(h -> "ACTIVE".equalsIgnoreCase(h.getStatus()) && HotelStatus.PUBLICATION_ACTIVE.equalsIgnoreCase(h.getPublicationStatus()))
                .map(Hotel::getId)
                .toList();

        long totalInventoryToday = activeHotelIds.isEmpty() ? 0 : roomRepository.sumInventoryCountByHotelIdsAndStatus(activeHotelIds, "ACTIVE");
        long bookedToday = activeHotelIds.isEmpty() ? 0 : reservationItemRepository.bookedQuantityForNightForHotels(activeHotelIds, today);
        long availableRoomsToday = Math.max(0, totalInventoryToday - bookedToday);
        double occupancyPercentage = totalInventoryToday > 0 ? ((double) bookedToday / totalInventoryToday) * 100.0 : 0.0;
        occupancyPercentage = Math.round(occupancyPercentage * 10.0) / 10.0;
        long upcomingReservations = allReservations.stream()
                .filter(r -> r.getCheckIn() != null && r.getCheckIn().isAfter(today.minusDays(1)))
                .count();

        List<ManagementDashboardDTO.AttentionItem> attentionItems = new ArrayList<>();
        List<ManagementDashboardDTO.SetupPendingItem> setupPendingItems = new ArrayList<>();

        for (Hotel hotel : scopedHotels) {
            if (HotelStatus.SETUP_PENDING.equalsIgnoreCase(hotel.getSetupStatus())) {
                int percentage = "COMPLETE".equalsIgnoreCase(hotel.getSetupStatus()) ? 100 : 60;
                setupPendingItems.add(new ManagementDashboardDTO.SetupPendingItem(
                        hotel.getId(),
                        hotel.getName(),
                        percentage,
                        2,
                        "Required fields missing"
                ));

                attentionItems.add(new ManagementDashboardDTO.AttentionItem(
                        "setup-" + hotel.getId(),
                        "MEDIUM",
                        "Setup Incomplete",
                        hotel.getId(),
                        hotel.getName(),
                        "Property setup configuration is incomplete.",
                        "CONTINUE_SETUP",
                        "/management/hotels/" + hotel.getId() + "/setup"
                ));
            }
        }

        ManagementDashboardDTO.TodayOperations todayOperations = new ManagementDashboardDTO.TodayOperations(
                arrivalsToday,
                departuresToday,
                availableRoomsToday,
                occupancyPercentage,
                upcomingReservations,
                attentionItems.size()
        );

        List<ManagementDashboardDTO.RecentReservationItem> recentReservations = allReservations.stream()
                .limit(5)
                .map(r -> {
                    String hName = allHotels.stream()
                            .filter(h -> Objects.equals(h.getId(), r.getHotelId()))
                            .findFirst()
                            .map(Hotel::getName)
                            .orElse("Property #" + r.getHotelId());
                    return new ManagementDashboardDTO.RecentReservationItem(
                            String.valueOf(r.getId()),
                            r.getReservationCode(),
                            r.getGuestName(),
                            r.getHotelId(),
                            hName,
                            r.getCheckIn() != null ? r.getCheckIn().toString() : "Today",
                            r.getCheckOut() != null ? r.getCheckOut().toString() : "Tomorrow",
                            r.getReservationStatus().name(),
                            r.getAssignmentState().name()
                    );
                })
                .toList();

        List<ManagementDashboardDTO.PropertyStatusItem> propertyStatuses = scopedHotels.stream()
                .map(h -> new ManagementDashboardDTO.PropertyStatusItem(
                        h.getId(),
                        h.getName(),
                        h.getPublicationStatus(),
                        h.getSetupStatus(),
                        Instant.now().toString()
                ))
                .limit(10)
                .toList();

        List<ManagementDashboardDTO.RecentActivityItem> recentActivity = new ArrayList<>();
        if ("MANAGER".equalsIgnoreCase(role)) {
            List<SecurityAudit> audits = securityAuditRepository.findTop10ByOrderByOccurredAtDesc();
            recentActivity = audits.stream()
                    .map(a -> new ManagementDashboardDTO.RecentActivityItem(
                            a.getId(),
                            a.getEventType() != null ? a.getEventType().name() : "SECURITY_EVENT",
                            formatEventTypeLabel(a.getEventType() != null ? a.getEventType().name() : "EVENT"),
                            "Security audit event (" + a.getResult() + ")",
                            a.getOccurredAt() != null ? a.getOccurredAt().toString() : Instant.now().toString(),
                            a.getResult()
                    ))
                    .toList();
        }

        ManagementDashboardDTO.DashboardScope scope = new ManagementDashboardDTO.DashboardScope(
                role,
                effectiveHotelId,
                propertyName
        );

        return new ManagementDashboardDTO(
                scope,
                portfolioKPIs,
                todayOperations,
                attentionItems.stream().limit(8).toList(),
                setupPendingItems.stream().limit(5).toList(),
                recentReservations,
                propertyStatuses,
                recentActivity,
                Instant.now()
        );
    }

    private String formatEventTypeLabel(String type) {
        if (type == null) return "System Activity";
        return type.replace('_', ' ');
    }
}
