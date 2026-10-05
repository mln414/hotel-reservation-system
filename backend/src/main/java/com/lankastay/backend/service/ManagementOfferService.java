package com.lankastay.backend.service;

import com.lankastay.backend.dto.offer.CreateOfferRequest;
import com.lankastay.backend.dto.offer.OfferResponse;
import com.lankastay.backend.dto.offer.OfferStatusRequest;
import com.lankastay.backend.dto.offer.UpdateOfferRequest;
import com.lankastay.backend.entity.Hotel;
import com.lankastay.backend.entity.Offer;
import com.lankastay.backend.entity.Room;
import com.lankastay.backend.entity.SecurityEventType;
import com.lankastay.backend.exception.BusinessRuleException;
import com.lankastay.backend.exception.ConflictException;
import com.lankastay.backend.exception.ResourceNotFoundException;
import com.lankastay.backend.repository.HotelRepository;
import com.lankastay.backend.repository.OfferRepository;
import com.lankastay.backend.repository.ReservationRepository;
import com.lankastay.backend.repository.RoomRepository;
import com.lankastay.backend.security.StaffPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class ManagementOfferService {

    private static final String ALL_DAYS = "MON,TUE,WED,THU,FRI,SAT,SUN";
    private static final Set<String> VALID_DAYS = Set.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");

    private final OfferRepository offerRepository;
    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final ReservationRepository reservationRepository;
    private final SecurityAuditService audit;

    public ManagementOfferService(
            OfferRepository offerRepository,
            HotelRepository hotelRepository,
            RoomRepository roomRepository,
            ReservationRepository reservationRepository,
            SecurityAuditService audit
    ) {
        this.offerRepository = offerRepository;
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
        this.reservationRepository = reservationRepository;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<OfferResponse> getOffers(StaffPrincipal principal, Long hotelId) {
        Long targetHotelId = "MANAGER".equalsIgnoreCase(principal.role()) ? hotelId : principal.assignedHotelId();
        if (!"MANAGER".equalsIgnoreCase(principal.role()) && hotelId != null && !hotelId.equals(principal.assignedHotelId())) {
            throw new AccessDeniedException("Staff cannot view offers for other hotels.");
        }
        List<Offer> list = targetHotelId == null
                ? offerRepository.findAll()
                : offerRepository.findByHotelId(targetHotelId);
        return list.stream().map(OfferResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Optional<OfferResponse> getOfferById(StaffPrincipal principal, Long id) {
        Optional<Offer> offerOpt = offerRepository.findById(id);
        if (offerOpt.isPresent()) {
            Offer offer = offerOpt.get();
            if (!"MANAGER".equalsIgnoreCase(principal.role()) && principal.assignedHotelId() != null) {
                boolean targetsAssigned = offer.getTargetHotelIds().isEmpty() || offer.getTargetHotelIds().contains(principal.assignedHotelId());
                if (!targetsAssigned) {
                    throw new AccessDeniedException("Staff cannot access offers that do not target their assigned hotel.");
                }
            }
        }
        return offerOpt.map(OfferResponse::from);
    }

    @Transactional
    public OfferResponse createOffer(StaffPrincipal principal, CreateOfferRequest request) {
        if (!"MANAGER".equalsIgnoreCase(principal.role())) {
            throw new AccessDeniedException("Only managers can create promotional offers.");
        }

        validateOfferDatesAndDiscount(
                request.stayStartDate(), request.stayEndDate(),
                request.bookingStartDate(), request.bookingEndDate(),
                request.discountType(), request.discountValue(),
                request.minimumStay(), request.maximumStay()
        );

        validateTargets(request.targetHotelIds(), request.targetRoomTypeIds());
        String requestedStatus = normalizeStatus(request.status());

        String slug = generateUniqueSlug(request.title(), null);

        Offer offer = new Offer();
        offer.setSlug(slug);
        offer.setTitle(request.title().trim());
        offer.setShortDescription(request.shortDescription().trim());
        offer.setFullDescription(request.fullDescription().trim());
        offer.setDiscountType(request.discountType().trim().toUpperCase());
        offer.setDiscountValue(request.discountValue());
        offer.setFixedDiscountScope(request.fixedDiscountScope() != null && !request.fixedDiscountScope().isBlank()
                ? request.fixedDiscountScope().trim().toUpperCase() : "PER_STAY");
        offer.setStayStartDate(request.stayStartDate());
        offer.setStayEndDate(request.stayEndDate());
        offer.setBookingStartDate(request.bookingStartDate());
        offer.setBookingEndDate(request.bookingEndDate());
        offer.setMinimumStay(request.minimumStay() != null ? request.minimumStay() : 1);
        offer.setMaximumStay(request.maximumStay());
        offer.setApplicableDays(normalizeApplicableDays(request.applicableDays()));
        offer.setStatus(requestedStatus);
        offer.setFeatured(request.featured() != null ? request.featured() : false);
        offer.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        offer.setImage(request.image());
        offer.setTargetRoomCategoryKeys(request.targetRoomCategoryKeys());

        offer.setTermsJson(formatTermsJson(request.terms(), request.termsJson()));

        if (request.targetHotelIds() != null) offer.setTargetHotelIds(new HashSet<>(request.targetHotelIds()));
        if (request.targetRoomTypeIds() != null) offer.setTargetRoomTypeIds(new HashSet<>(request.targetRoomTypeIds()));

        Offer saved = offerRepository.save(offer);
        audit.record(principal.id(), null, SecurityEventType.OFFER_CREATED, "Offer", "SUCCESS");
        return OfferResponse.from(saved);
    }

    @Transactional
    public OfferResponse updateOffer(StaffPrincipal principal, Long id, UpdateOfferRequest request) {
        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found with ID: " + id));

        if (!"MANAGER".equalsIgnoreCase(principal.role())) {
            if (principal.assignedHotelId() != null && !offer.getTargetHotelIds().contains(principal.assignedHotelId())) {
                throw new AccessDeniedException("Staff cannot edit offers for other hotels.");
            }
        }

        validateOfferDatesAndDiscount(
                request.stayStartDate(), request.stayEndDate(),
                request.bookingStartDate(), request.bookingEndDate(),
                request.discountType(), request.discountValue(),
                request.minimumStay(), request.maximumStay()
        );

        validateTargets(request.targetHotelIds(), request.targetRoomTypeIds());
        offer.setTitle(request.title().trim());
        offer.setShortDescription(request.shortDescription().trim());
        offer.setFullDescription(request.fullDescription().trim());
        offer.setDiscountType(request.discountType().trim().toUpperCase());
        offer.setDiscountValue(request.discountValue());
        if (request.fixedDiscountScope() != null && !request.fixedDiscountScope().isBlank()) {
            offer.setFixedDiscountScope(request.fixedDiscountScope().trim().toUpperCase());
        }
        offer.setStayStartDate(request.stayStartDate());
        offer.setStayEndDate(request.stayEndDate());
        offer.setBookingStartDate(request.bookingStartDate());
        offer.setBookingEndDate(request.bookingEndDate());
        offer.setMinimumStay(request.minimumStay() != null ? request.minimumStay() : 1);
        offer.setMaximumStay(request.maximumStay());
        if (request.applicableDays() != null && !request.applicableDays().isBlank()) {
            offer.setApplicableDays(normalizeApplicableDays(request.applicableDays()));
        }
        if (request.featured() != null) offer.setFeatured(request.featured());
        if (request.displayOrder() != null) offer.setDisplayOrder(request.displayOrder());
        if (request.image() != null) offer.setImage(request.image());
        if (request.targetRoomCategoryKeys() != null) offer.setTargetRoomCategoryKeys(request.targetRoomCategoryKeys());

        offer.setTermsJson(formatTermsJson(request.terms(), request.termsJson()));

        if (request.targetHotelIds() != null) offer.setTargetHotelIds(new HashSet<>(request.targetHotelIds()));
        if (request.targetRoomTypeIds() != null) offer.setTargetRoomTypeIds(new HashSet<>(request.targetRoomTypeIds()));

        Offer saved = offerRepository.save(offer);
        audit.record(principal.id(), null, SecurityEventType.OFFER_UPDATED, "Offer", "SUCCESS");
        return OfferResponse.from(saved);
    }

    @Transactional
    public OfferResponse updateStatus(StaffPrincipal principal, Long id, OfferStatusRequest request) {
        if (!"MANAGER".equalsIgnoreCase(principal.role())) {
            throw new AccessDeniedException("Only managers can change offer status.");
        }

        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found with ID: " + id));

        String newStatus = request.status().trim().toUpperCase();
        if (!"DRAFT".equals(newStatus) && !"ACTIVE".equals(newStatus) && !"INACTIVE".equals(newStatus)) {
            throw new BusinessRuleException("Status must be DRAFT, ACTIVE, or INACTIVE.");
        }

        if ("ACTIVE".equals(newStatus)) {
            validatePublishable(offer.getTitle(), offer.getShortDescription(), offer.getFullDescription(),
                    offer.getTargetHotelIds(), offer.getTargetRoomTypeIds(), offer.getTargetRoomCategoryKeys());
        }

        offer.setStatus(newStatus);
        Offer saved = offerRepository.save(offer);

        SecurityEventType eventType = "ACTIVE".equals(newStatus) ? SecurityEventType.OFFER_ACTIVATED : SecurityEventType.OFFER_DEACTIVATED;
        audit.record(principal.id(), null, eventType, "Offer", "SUCCESS");
        return OfferResponse.from(saved);
    }

    @Transactional
    public void deleteOffer(StaffPrincipal principal, Long id) {
        if (!"MANAGER".equalsIgnoreCase(principal.role())) {
            throw new AccessDeniedException("Only managers can delete offers.");
        }

        Offer offer = offerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found with ID: " + id));

        // Reservations hold monetary and offer-description snapshots.  Retain
        // those immutable values, explicitly remove only the nullable live FK,
        // then hard-delete the offer.  The offer_* mapping rows are owned by
        // Offer and are removed by their existing ON DELETE CASCADE FKs.
        reservationRepository.detachAppliedOffer(id);
        offerRepository.delete(offer);
        offerRepository.flush();
        audit.record(principal.id(), null, SecurityEventType.OFFER_DELETED, "Offer", "SUCCESS");
    }

    private void validateOfferDatesAndDiscount(
            LocalDate stayStart, LocalDate stayEnd,
            LocalDate bookStart, LocalDate bookEnd,
            String discountType, BigDecimal discountValue,
            Integer minStay, Integer maxStay
    ) {
        if (stayStart == null || stayEnd == null) {
            throw new BusinessRuleException("Stay start date and stay end date are required.");
        }
        if (stayEnd.isBefore(stayStart)) {
            throw new BusinessRuleException("Stay end date cannot be before stay start date.");
        }
        if (bookStart != null && bookEnd != null && bookEnd.isBefore(bookStart)) {
            throw new BusinessRuleException("Booking end date cannot be before booking start date.");
        }
        if (discountValue == null || discountValue.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Discount value must be greater than zero.");
        }
        String type = discountType != null ? discountType.trim().toUpperCase() : "";
        if ("PERCENTAGE".equals(type)) {
            if (discountValue.compareTo(BigDecimal.valueOf(100)) > 0) {
                throw new BusinessRuleException("Percentage discount cannot exceed 100%.");
            }
        } else if (!"FIXED_AMOUNT".equals(type)) {
            throw new BusinessRuleException("Discount type must be PERCENTAGE or FIXED_AMOUNT.");
        }
        if (minStay != null && minStay < 1) {
            throw new BusinessRuleException("Minimum stay must be at least 1 night.");
        }
        if (maxStay != null && minStay != null && maxStay < minStay) {
            throw new BusinessRuleException("Maximum stay cannot be less than minimum stay.");
        }
    }

    private String normalizeStatus(String value) {
        String status = value == null || value.isBlank() ? "DRAFT" : value.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("DRAFT", "ACTIVE", "INACTIVE").contains(status)) {
            throw new BusinessRuleException("Status must be DRAFT, ACTIVE, or INACTIVE.");
        }
        return status;
    }

    private void validatePublishable(String title, String shortDescription, String fullDescription,
                                     Set<Long> hotelIds, Set<Long> roomIds, String categoryKeys) {
        if (title == null || title.trim().length() < 2) {
            throw new BusinessRuleException("Offer title must contain at least 2 characters before publishing.");
        }
        if (shortDescription == null || shortDescription.trim().isBlank()) {
            throw new BusinessRuleException("A short description is required before publishing.");
        }
        if (fullDescription == null || fullDescription.trim().isBlank()) {
            throw new BusinessRuleException("A full description is required before publishing.");
        }
        boolean hasHotel = hotelIds != null && !hotelIds.isEmpty();
        boolean hasRoom = roomIds != null && !roomIds.isEmpty();
        boolean hasCategory = categoryKeys != null && !categoryKeys.trim().isBlank();
        if (!hasHotel && !hasRoom && !hasCategory) {
            throw new BusinessRuleException("Select at least one hotel, room type, or room category before publishing.");
        }
    }

    private void validateTargets(Set<Long> hotelIds, Set<Long> roomIds) {
        if (hotelIds != null) {
            for (Long hotelId : hotelIds) {
                if (!hotelRepository.existsById(hotelId)) {
                    throw new ResourceNotFoundException("Targeted hotel not found with ID: " + hotelId);
                }
            }
        }
        if (roomIds != null) {
            for (Long roomId : roomIds) {
                Room room = roomRepository.findById(roomId)
                        .orElseThrow(() -> new ResourceNotFoundException("Targeted room not found with ID: " + roomId));
                if (hotelIds != null && !hotelIds.isEmpty() && !hotelIds.contains(room.getHotelId())) {
                    throw new BusinessRuleException("Room ID " + roomId + " belongs to hotel ID " + room.getHotelId() +
                            ", which is not among the targeted hotels.");
                }
            }
        }
    }

    private String normalizeApplicableDays(String applicableDays) {
        if (applicableDays == null || applicableDays.isBlank()) return ALL_DAYS;

        List<String> days = Arrays.stream(applicableDays.split(",", -1))
                .map(String::trim)
                .map(value -> value.toUpperCase(Locale.ROOT))
                .toList();
        if (days.stream().anyMatch(day -> !VALID_DAYS.contains(day)) || new HashSet<>(days).size() != days.size()) {
            throw new BusinessRuleException("Applicable days must contain unique values from MON, TUE, WED, THU, FRI, SAT, and SUN.");
        }
        return String.join(",", days);
    }

    private String generateUniqueSlug(String title, Long excludeId) {
        String base = title.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
        if (base.isBlank()) base = "offer";

        String candidate = base;
        int suffix = 2;
        while (offerRepository.existsBySlug(candidate)) {
            Optional<Offer> existing = offerRepository.findBySlug(candidate);
            if (existing.isPresent() && existing.get().getId().equals(excludeId)) {
                return candidate;
            }
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private String formatTermsJson(List<String> terms, String existingJson) {
        if (terms != null) {
            if (terms.isEmpty()) return "[]";
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < terms.size(); i++) {
                if (i > 0) sb.append(",");
                String escaped = terms.get(i).replace("\\", "\\\\").replace("\"", "\\\"");
                sb.append("\"").append(escaped).append("\"");
            }
            sb.append("]");
            return sb.toString();
        }
        return existingJson != null && !existingJson.isBlank() ? existingJson : "[]";
    }
}
