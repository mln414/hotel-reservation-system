// SE2030 LankaStay - Hotel Management
// Functional Owner: Wickramasinghe M.P.T.H - IT25300115

package com.lankastay.backend.service;

import com.lankastay.backend.dto.hotel.*;
import com.lankastay.backend.entity.*;
import com.lankastay.backend.exception.ResourceNotFoundException;
import com.lankastay.backend.repository.DestinationRepository;
import com.lankastay.backend.repository.HotelRepository;
import com.lankastay.backend.repository.StaffUserRepository;
import com.lankastay.backend.security.StaffPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class HotelService {

    private static final Pattern NONLATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]");

    private final HotelRepository hotelRepository;
    private final DestinationRepository destinationRepository;
    private final StaffUserRepository staffUserRepository;
    private final JdbcTemplate jdbcTemplate;
    private final SecurityAuditService auditService;

    public HotelService(HotelRepository hotelRepository, DestinationRepository destinationRepository,
                        StaffUserRepository staffUserRepository, SecurityAuditService auditService,
                        JdbcTemplate jdbcTemplate) {
        this.hotelRepository = hotelRepository;
        this.destinationRepository = destinationRepository;
        this.staffUserRepository = staffUserRepository;
        this.auditService = auditService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<HotelResponse> filterHotels(String search, Long destinationId, String setupStatus, String publicationStatus, String propertyType, StaffPrincipal principal) {
        List<Hotel> hotels = hotelRepository.filterHotels(
                search != null && !search.isBlank() ? search.trim() : null,
                destinationId,
                setupStatus != null && !setupStatus.isBlank() ? setupStatus.trim() : null,
                publicationStatus != null && !publicationStatus.isBlank() ? publicationStatus.trim() : null,
                propertyType != null && !propertyType.isBlank() ? propertyType.trim() : null
        );

        Map<Long, String> destinationNames = destinationRepository.findAll().stream()
                .collect(Collectors.toMap(Destination::getId, Destination::getName, (a, b) -> a));

        return hotels.stream()
                .filter(hotel -> isAuthorizedForHotel(principal, hotel.getId()))
                .map(hotel -> HotelResponse.from(hotel, destinationNames.getOrDefault(hotel.getDestinationId(), "Unknown")))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<HotelResponse> getActiveHotels() {
        List<Hotel> activeHotels = hotelRepository.findByStatus(HotelStatus.PUBLICATION_ACTIVE);
        Map<Long, String> destinationNames = destinationRepository.findAll().stream()
                .collect(Collectors.toMap(Destination::getId, Destination::getName, (a, b) -> a));
        return activeHotels.stream()
                .map(hotel -> HotelResponse.from(hotel, destinationNames.getOrDefault(hotel.getDestinationId(), "Unknown")))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<HotelResponse> getActiveHotelsByDestination(Long destinationId) {
        List<Hotel> activeHotels = hotelRepository.findByDestinationId(destinationId).stream()
                .filter(h -> HotelStatus.PUBLICATION_ACTIVE.equals(h.getPublicationStatus()) || HotelStatus.PUBLICATION_ACTIVE.equals(h.getStatus()))
                .toList();
        String destinationName = destinationRepository.findById(destinationId)
                .map(Destination::getName).orElse("Unknown");
        return activeHotels.stream()
                .map(hotel -> HotelResponse.from(hotel, destinationName))
                .toList();
    }

    @Transactional(readOnly = true)
    public HotelResponse getActiveHotelBySlugOrId(String identifier) {
        Hotel hotel = null;
        try {
            Long id = Long.parseLong(identifier);
            hotel = hotelRepository.findById(id).orElse(null);
        } catch (NumberFormatException ignored) {}

        if (hotel == null) {
            hotel = hotelRepository.findBySlug(identifier).orElse(null);
        }

        if (hotel == null) {
            throw new ResourceNotFoundException("Active hotel not found with identifier: " + identifier);
        }

        if (!HotelStatus.PUBLICATION_ACTIVE.equals(hotel.getPublicationStatus())
                || !HotelStatus.PUBLICATION_ACTIVE.equals(hotel.getStatus())) {
            throw new ResourceNotFoundException("Active hotel not found with identifier: " + identifier);
        }

        String destinationName = destinationRepository.findById(hotel.getDestinationId())
                .map(Destination::getName).orElse("Unknown");
        return HotelResponse.from(hotel, destinationName);
    }

    @Transactional(readOnly = true)
    public HotelResponse getHotelById(Long id, StaffPrincipal principal) {
        // Security: authorization is checked against the authenticated staff member's permitted hotel scope to prevent IDOR access.
        verifyStaffHotelScope(principal, id);
        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + id));

        String destinationName = destinationRepository.findById(hotel.getDestinationId())
                .map(Destination::getName).orElse("Unknown");

        return HotelResponse.from(hotel, destinationName);
    }

    @Transactional
    public HotelResponse createHotel(CreateHotelRequest request, StaffPrincipal principal, String ipAddress) {
        if (!destinationRepository.existsById(request.destinationId())) {
            throw new IllegalArgumentException("Destination does not exist with id: " + request.destinationId());
        }

        String slug = createSlug(request.name());
        if (hotelRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis() % 10000;
        }

        Hotel hotel = new Hotel();
        hotel.setName(request.name().trim());
        hotel.setSlug(slug);
        hotel.setDestinationId(request.destinationId());
        hotel.setPropertyType(request.propertyType().trim());
        hotel.setCategory(request.category() != null ? request.category().trim() : request.propertyType().trim());
        if (request.price() != null) hotel.setPrice(request.price());
        if (request.mainImage() != null) hotel.setMainImage(request.mainImage());
        if (request.badge() != null) hotel.setBadge(request.badge());
        if (request.featured() != null) hotel.setFeatured(request.featured());
        if (request.shortDescription() != null) hotel.setShortDescription(request.shortDescription());
        if (request.detailDescription() != null) hotel.setDetailDescription(request.detailDescription());
        if (request.tagline() != null) hotel.setTagline(request.tagline());
        if (request.checkInTime() != null) hotel.setCheckInTime(request.checkInTime());
        if (request.checkOutTime() != null) hotel.setCheckOutTime(request.checkOutTime());
        if (request.address() != null) hotel.setAddress(request.address());
        if (request.city() != null) hotel.setCity(request.city());
        if (request.province() != null) hotel.setProvince(request.province());
        if (request.postalCode() != null) hotel.setPostalCode(request.postalCode());
        if (request.email() != null) hotel.setEmail(request.email());
        if (request.phone() != null) hotel.setPhone(request.phone());
        if (request.website() != null) hotel.setWebsite(request.website());
        if (request.latitude() != null) hotel.setLatitude(request.latitude());
        if (request.longitude() != null) hotel.setLongitude(request.longitude());
        if (request.yearOpened() != null) hotel.setYearOpened(request.yearOpened());
        if (request.propertySize() != null) hotel.setPropertySize(request.propertySize());
        if (request.languages() != null) hotel.setLanguages(request.languages());
        if (request.videoUrl() != null) hotel.setVideoUrl(request.videoUrl());
        if (request.policyRecords() != null) hotel.setPoliciesJson(HotelPolicyJson.write(request.policyRecords()));
        if (request.facilities() != null) hotel.setFacilities(request.facilities());
        if (request.gallery() != null) hotel.setGallery(request.gallery());
        if (request.collectionIds() != null) hotel.setCollectionIds(request.collectionIds());

        hotel.setStatus(HotelStatus.PUBLICATION_INACTIVE);
        hotel.setPublicationStatus(HotelStatus.PUBLICATION_INACTIVE);
        hotel.setSetupStatus(calculateSetupReadiness(hotel));

        Hotel saved = hotelRepository.save(hotel);

        // Record security audit event
        auditService.record(principal.id(), null, SecurityEventType.HOTEL_CREATED, ipAddress, "SUCCESS");

        String destinationName = destinationRepository.findById(saved.getDestinationId())
                .map(Destination::getName).orElse("Unknown");
        return HotelResponse.from(saved, destinationName);
    }

    @Transactional
    public HotelResponse updateHotel(Long id, UpdateHotelRequest request, StaffPrincipal principal, String ipAddress) {
        // Security: authorization is checked against the authenticated staff member's permitted hotel scope to prevent IDOR access.
        verifyStaffHotelScope(principal, id);

        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + id));

        if (request.name() != null && !request.name().isBlank()) {
            hotel.setName(request.name().trim());
            String newSlug = createSlug(request.name());
            if (hotelRepository.existsBySlugAndIdNot(newSlug, id)) {
                newSlug = newSlug + "-" + id;
            }
            hotel.setSlug(newSlug);
        }
        if (request.destinationId() != null) {
            if (!destinationRepository.existsById(request.destinationId())) {
                throw new IllegalArgumentException("Destination does not exist with id: " + request.destinationId());
            }
            hotel.setDestinationId(request.destinationId());
        }
        if (request.propertyType() != null && !request.propertyType().isBlank()) {
            hotel.setPropertyType(request.propertyType().trim());
        }
        if (request.category() != null) hotel.setCategory(request.category());
        if (request.price() != null) hotel.setPrice(request.price());
        if (request.mainImage() != null) hotel.setMainImage(request.mainImage());
        if (request.badge() != null) hotel.setBadge(request.badge());
        if (request.featured() != null) hotel.setFeatured(request.featured());
        if (request.shortDescription() != null) hotel.setShortDescription(request.shortDescription());
        if (request.detailDescription() != null) hotel.setDetailDescription(request.detailDescription());
        if (request.tagline() != null) hotel.setTagline(request.tagline());
        if (request.checkInTime() != null) hotel.setCheckInTime(request.checkInTime());
        if (request.checkOutTime() != null) hotel.setCheckOutTime(request.checkOutTime());
        if (request.address() != null) hotel.setAddress(request.address());
        if (request.city() != null) hotel.setCity(request.city());
        if (request.province() != null) hotel.setProvince(request.province());
        if (request.postalCode() != null) hotel.setPostalCode(request.postalCode());
        if (request.email() != null) hotel.setEmail(request.email());
        if (request.phone() != null) hotel.setPhone(request.phone());
        if (request.website() != null) hotel.setWebsite(request.website());
        if (request.latitude() != null) hotel.setLatitude(request.latitude());
        if (request.longitude() != null) hotel.setLongitude(request.longitude());
        if (request.yearOpened() != null) hotel.setYearOpened(request.yearOpened());
        if (request.propertySize() != null) hotel.setPropertySize(request.propertySize());
        if (request.languages() != null) hotel.setLanguages(request.languages());
        if (request.videoUrl() != null) hotel.setVideoUrl(request.videoUrl());
        if (request.policyRecords() != null) hotel.setPoliciesJson(HotelPolicyJson.write(request.policyRecords()));
        if (request.lastUpdatedSection() != null) hotel.setLastUpdatedSection(request.lastUpdatedSection());
        if (request.facilities() != null) hotel.setFacilities(request.facilities());
        if (request.gallery() != null) hotel.setGallery(request.gallery());
        if (request.collectionIds() != null) hotel.setCollectionIds(request.collectionIds());

        hotel.setSetupStatus(calculateSetupReadiness(hotel));

        Hotel updated = hotelRepository.save(hotel);

        // Audit log
        auditService.record(principal.id(), null, SecurityEventType.HOTEL_UPDATED, ipAddress, "SUCCESS");

        String destinationName = destinationRepository.findById(updated.getDestinationId())
                .map(Destination::getName).orElse("Unknown");
        return HotelResponse.from(updated, destinationName);
    }

    @Transactional
    public HotelResponse updateHotelStatus(Long id, String status, StaffPrincipal principal, String ipAddress) {
        // Security: authorization is checked against the authenticated staff member's permitted hotel scope to prevent IDOR access.
        verifyStaffHotelScope(principal, id);

        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + id));

        String rawStatus = status.toUpperCase(Locale.ROOT);
        String targetStatus = (rawStatus.equals("ACTIVE") || rawStatus.equals("PUBLICATION_ACTIVE"))
                ? HotelStatus.PUBLICATION_ACTIVE
                : (rawStatus.equals("INACTIVE") || rawStatus.equals("PUBLICATION_INACTIVE"))
                ? HotelStatus.PUBLICATION_INACTIVE
                : null;

        if (targetStatus == null) {
            throw new IllegalArgumentException("Invalid status value. Allowed: ACTIVE, INACTIVE, PUBLICATION_ACTIVE, PUBLICATION_INACTIVE");
        }

        if (HotelStatus.PUBLICATION_ACTIVE.equals(targetStatus)) {
            String currentSetup = calculateSetupReadiness(hotel);
            if (!HotelStatus.SETUP_COMPLETE.equals(currentSetup)) {
                throw new IllegalStateException("Hotel cannot be published before setup is complete.");
            }
        }

        hotel.setStatus(targetStatus);
        hotel.setPublicationStatus(targetStatus);
        Hotel updated = hotelRepository.save(hotel);

        SecurityEventType eventType = HotelStatus.PUBLICATION_ACTIVE.equals(targetStatus)
                ? SecurityEventType.HOTEL_ACTIVATED
                : SecurityEventType.HOTEL_DEACTIVATED;
        auditService.record(principal.id(), null, eventType, ipAddress, "SUCCESS");

        String destinationName = destinationRepository.findById(updated.getDestinationId())
                .map(Destination::getName).orElse("Unknown");
        return HotelResponse.from(updated, destinationName);
    }

    @Transactional
    public HotelDeleteResponse deleteHotel(Long id, String confirmationName, StaffPrincipal principal, String ipAddress) {
        // Security: authorization is checked against the authenticated staff member's permitted hotel scope to prevent IDOR access.
        verifyStaffHotelScope(principal, id);

        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + id));

        if (confirmationName == null || !hotel.getName().equals(confirmationName)) {
            throw new IllegalArgumentException("Type the exact Hotel name to confirm permanent deletion.");
        }

        // Delete the complete Hotel aggregate in foreign-key-safe order. The surrounding
        // transaction guarantees that a failure rolls every deletion back.
        jdbcTemplate.update("DELETE FROM review_photos WHERE review_id IN (SELECT id FROM reviews WHERE hotel_id = ?)", id);
        jdbcTemplate.update("DELETE FROM reviews WHERE hotel_id = ?", id);
        jdbcTemplate.update("DELETE FROM reservation_items WHERE reservation_id IN (SELECT id FROM reservations WHERE hotel_id = ?)", id);
        jdbcTemplate.update("DELETE FROM reservations WHERE hotel_id = ?", id);
        // Empty offer targets mean unrestricted eligibility. Disable offers losing
        // their last hotel or room target before removing those targeting links.
        jdbcTemplate.update("""
                UPDATE offers SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP
                WHERE id IN (SELECT offer_id FROM offer_hotels WHERE hotel_id = ?)
                  AND id NOT IN (SELECT offer_id FROM offer_hotels WHERE hotel_id <> ?)
                """, id, id);
        jdbcTemplate.update("""
                UPDATE offers SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP
                WHERE id IN (SELECT offer_id FROM offer_rooms WHERE room_id IN (SELECT id FROM rooms WHERE hotel_id = ?))
                  AND id NOT IN (SELECT offer_id FROM offer_rooms WHERE room_id NOT IN (SELECT id FROM rooms WHERE hotel_id = ?))
                """, id, id);
        jdbcTemplate.update("DELETE FROM offer_rooms WHERE room_id IN (SELECT id FROM rooms WHERE hotel_id = ?)", id);
        jdbcTemplate.update("DELETE FROM offer_hotels WHERE hotel_id = ?", id);
        jdbcTemplate.update("DELETE FROM room_gallery WHERE room_id IN (SELECT id FROM rooms WHERE hotel_id = ?)", id);
        jdbcTemplate.update("DELETE FROM room_rates WHERE hotel_id = ?", id);
        jdbcTemplate.update("DELETE FROM rooms WHERE hotel_id = ?", id);
        jdbcTemplate.update("UPDATE staff_users SET assigned_hotel_id = NULL WHERE assigned_hotel_id = ?", id);

        // Hotel facilities, gallery and collections are removed with the entity.
        hotelRepository.delete(hotel);
        hotelRepository.flush();

        auditService.record(principal.id(), null, SecurityEventType.HOTEL_DELETED, ipAddress, "SUCCESS");

        return new HotelDeleteResponse("Hotel '" + hotel.getName() + "' and its associated hotel-owned configuration were permanently deleted.", id);
    }

    private String calculateSetupReadiness(Hotel hotel) {
        boolean basic = hotel.getName() != null && !hotel.getName().isBlank() && hotel.getPropertyType() != null;
        boolean destination = hotel.getDestinationId() != null && destinationRepository.existsById(hotel.getDestinationId());
        boolean location = (hotel.getAddress() != null && !hotel.getAddress().isBlank()) || "COMPLETE".equals(hotel.getSetupStatus()) || HotelStatus.SETUP_COMPLETE.equals(hotel.getSetupStatus());
        boolean gallery = (hotel.getMainImage() != null && !hotel.getMainImage().isBlank()) || (hotel.getGallery() != null && !hotel.getGallery().isEmpty());

        if (basic && destination && location && gallery) {
            return HotelStatus.SETUP_COMPLETE;
        }
        return HotelStatus.SETUP_PENDING;
    }

    private void verifyStaffHotelScope(StaffPrincipal principal, Long hotelId) {
        if (principal == null) {
            throw new AccessDeniedException("Authentication required.");
        }
        if (StaffRole.MANAGER.name().equals(principal.role())) {
            return; // Manager has access to all hotels
        }
        if (StaffRole.HOTEL_STAFF.name().equals(principal.role())) {
            StaffUser staffUser = staffUserRepository.findById(principal.id()).orElse(null);
            if (staffUser != null && staffUser.getAssignedHotelId() != null && !staffUser.getAssignedHotelId().equals(hotelId)) {
                throw new AccessDeniedException("You are not authorized to access or modify this hotel.");
            }
            return;
        }
        throw new AccessDeniedException("Access denied for role: " + principal.role());
    }

    private boolean isAuthorizedForHotel(StaffPrincipal principal, Long hotelId) {
        if (principal == null) return false;
        if (StaffRole.MANAGER.name().equals(principal.role())) return true;
        if (StaffRole.HOTEL_STAFF.name().equals(principal.role())) {
            StaffUser staffUser = staffUserRepository.findById(principal.id()).orElse(null);
            return staffUser == null || staffUser.getAssignedHotelId() == null || staffUser.getAssignedHotelId().equals(hotelId);
        }
        return false;
    }

    private static String createSlug(String input) {
        if (input == null) return "";
        String nowhitespace = WHITESPACE.matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = NONLATIN.matcher(normalized).replaceAll("");
        return slug.toLowerCase(Locale.ENGLISH).replaceAll("-+", "-").replaceAll("^-|-$", "");
    }
}
