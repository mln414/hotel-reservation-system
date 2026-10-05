package com.lankastay.backend.service;

import com.lankastay.backend.dto.rate.CreateRateRequest;
import com.lankastay.backend.dto.rate.RateResponse;
import com.lankastay.backend.dto.rate.RateStatusRequest;
import com.lankastay.backend.dto.rate.UpdateRateRequest;
import com.lankastay.backend.entity.Hotel;
import com.lankastay.backend.entity.Room;
import com.lankastay.backend.entity.RoomRate;
import com.lankastay.backend.entity.SecurityEventType;
import com.lankastay.backend.exception.BusinessRuleException;
import com.lankastay.backend.exception.ConflictException;
import com.lankastay.backend.exception.ResourceNotFoundException;
import com.lankastay.backend.repository.HotelRepository;
import com.lankastay.backend.repository.ReservationItemRepository;
import com.lankastay.backend.repository.RoomRateRepository;
import com.lankastay.backend.repository.RoomRepository;
import com.lankastay.backend.security.StaffPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class ManagementRateService {

    private final RoomRateRepository roomRateRepository;
    private final RoomRepository roomRepository;
    private final HotelRepository hotelRepository;
    private final ReservationItemRepository reservationItemRepository;
    private final SecurityAuditService audit;

    public ManagementRateService(
            RoomRateRepository roomRateRepository,
            RoomRepository roomRepository,
            HotelRepository hotelRepository,
            ReservationItemRepository reservationItemRepository,
            SecurityAuditService audit
    ) {
        this.roomRateRepository = roomRateRepository;
        this.roomRepository = roomRepository;
        this.hotelRepository = hotelRepository;
        this.reservationItemRepository = reservationItemRepository;
        this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<RateResponse> getRatesForHotel(StaffPrincipal principal, Long hotelId) {
        Long targetHotelId = "MANAGER".equalsIgnoreCase(principal.role()) ? hotelId : principal.assignedHotelId();
        if (!"MANAGER".equalsIgnoreCase(principal.role()) && hotelId != null && !hotelId.equals(principal.assignedHotelId())) {
            throw new AccessDeniedException("Staff cannot access rates belonging to another hotel.");
        }
        List<RoomRate> rates = targetHotelId == null
                ? roomRateRepository.findAll()
                : roomRateRepository.findByHotelId(targetHotelId);
        return rates.stream().map(RateResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<RateResponse> getRatesForRoom(StaffPrincipal principal, Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + roomId));
        if (!"MANAGER".equalsIgnoreCase(principal.role()) && !room.getHotelId().equals(principal.assignedHotelId())) {
            throw new AccessDeniedException("Staff cannot access rates belonging to another hotel's room.");
        }
        return roomRateRepository.findByRoomId(roomId).stream().map(RateResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public Optional<RateResponse> getRateById(StaffPrincipal principal, Long id) {
        Optional<RoomRate> rateOpt = roomRateRepository.findById(id);
        if (rateOpt.isPresent()) {
            RoomRate rate = rateOpt.get();
            if (!"MANAGER".equalsIgnoreCase(principal.role()) && !rate.getHotelId().equals(principal.assignedHotelId())) {
                throw new AccessDeniedException("Staff cannot access rates belonging to another hotel.");
            }
        }
        return rateOpt.map(RateResponse::from);
    }

    @Transactional
    public RateResponse createRate(StaffPrincipal principal, CreateRateRequest request) {
        if (!"MANAGER".equalsIgnoreCase(principal.role())) {
            throw new AccessDeniedException("Only managers can create room rate plans.");
        }

        Hotel hotel = hotelRepository.findById(request.hotelId())
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with ID: " + request.hotelId()));

        Room room = roomRepository.findById(request.roomId())
                .orElseThrow(() -> new ResourceNotFoundException("Room not found with ID: " + request.roomId()));

        if (!room.getHotelId().equals(request.hotelId())) {
            throw new BusinessRuleException("Cross-property mismatch: Room ID " + request.roomId() +
                    " belongs to hotel ID " + room.getHotelId() + ", not hotel ID " + request.hotelId());
        }

        if (request.baseNightlyRate() == null || request.baseNightlyRate().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Base nightly rate must be greater than zero.");
        }

        if (request.weekendNightlyRate() != null && request.weekendNightlyRate().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Weekend nightly rate must be greater than zero.");
        }

        if (request.validFrom() != null && request.validTo() != null && request.validTo().isBefore(request.validFrom())) {
            throw new BusinessRuleException("Valid to date cannot be before valid from date.");
        }

        if (roomRateRepository.existsByHotelIdAndRoomIdAndRatePlanCodeIgnoreCase(request.hotelId(), request.roomId(), request.ratePlanCode().trim())) {
            throw new ConflictException("A rate plan with code '" + request.ratePlanCode().trim() + "' already exists for this room.");
        }

        RoomRate rate = new RoomRate();
        rate.setHotelId(request.hotelId());
        rate.setRoomId(request.roomId());
        rate.setRatePlanName(request.ratePlanName().trim());
        rate.setRatePlanCode(request.ratePlanCode().trim().toUpperCase());
        rate.setRateType(request.rateType() != null && !request.rateType().isBlank() ? request.rateType() : "BASE");
        rate.setPricingMethod(request.pricingMethod() != null && !request.pricingMethod().isBlank() ? request.pricingMethod() : "SET_PRICE");
        rate.setBaseNightlyRate(request.baseNightlyRate());
        rate.setWeekendNightlyRate(request.weekendNightlyRate());
        rate.setValidFrom(request.validFrom());
        rate.setValidTo(request.validTo());
        rate.setMinimumStay(request.minimumStay() != null ? request.minimumStay() : 1);
        rate.setApplicableDays(request.applicableDays());
        rate.setMealPlan(request.mealPlan() != null && !request.mealPlan().isBlank() ? request.mealPlan() : "ROOM_ONLY");
        rate.setCancellationPolicy(request.cancellationPolicy() != null && !request.cancellationPolicy().isBlank() ? request.cancellationPolicy() : "FLEXIBLE_24H");
        rate.setDepositRequired(request.depositRequired() != null ? request.depositRequired() : false);
        rate.setDepositPercentage(request.depositPercentage() != null ? request.depositPercentage() : BigDecimal.ZERO);
        rate.setStatus("ACTIVE");
        rate.setNotes(request.notes());

        RoomRate saved = roomRateRepository.save(rate);
        audit.record(principal.id(), null, SecurityEventType.RATE_CREATED, "RoomRate", "SUCCESS");
        return RateResponse.from(saved);
    }

    @Transactional
    public RateResponse updateRate(StaffPrincipal principal, Long id, UpdateRateRequest request) {
        RoomRate rate = roomRateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room Rate not found with ID: " + id));

        if (!"MANAGER".equalsIgnoreCase(principal.role()) && !rate.getHotelId().equals(principal.assignedHotelId())) {
            throw new AccessDeniedException("Staff cannot modify rates belonging to another hotel.");
        }

        if (request.baseNightlyRate() == null || request.baseNightlyRate().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Base nightly rate must be greater than zero.");
        }

        if (request.weekendNightlyRate() != null && request.weekendNightlyRate().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("Weekend nightly rate must be greater than zero.");
        }

        if (request.validFrom() != null && request.validTo() != null && request.validTo().isBefore(request.validFrom())) {
            throw new BusinessRuleException("Valid to date cannot be before valid from date.");
        }

        if (roomRateRepository.existsByHotelIdAndRoomIdAndRatePlanCodeIgnoreCaseAndIdNot(rate.getHotelId(), rate.getRoomId(), request.ratePlanCode().trim(), id)) {
            throw new ConflictException("A rate plan with code '" + request.ratePlanCode().trim() + "' already exists for this room.");
        }

        rate.setRatePlanName(request.ratePlanName().trim());
        rate.setRatePlanCode(request.ratePlanCode().trim().toUpperCase());
        if (request.rateType() != null && !request.rateType().isBlank()) rate.setRateType(request.rateType());
        if (request.pricingMethod() != null && !request.pricingMethod().isBlank()) rate.setPricingMethod(request.pricingMethod());
        rate.setBaseNightlyRate(request.baseNightlyRate());
        rate.setWeekendNightlyRate(request.weekendNightlyRate());
        rate.setValidFrom(request.validFrom());
        rate.setValidTo(request.validTo());
        rate.setMinimumStay(request.minimumStay() != null ? request.minimumStay() : 1);
        rate.setApplicableDays(request.applicableDays());
        if (request.mealPlan() != null && !request.mealPlan().isBlank()) rate.setMealPlan(request.mealPlan());
        if (request.cancellationPolicy() != null && !request.cancellationPolicy().isBlank()) rate.setCancellationPolicy(request.cancellationPolicy());
        if (request.depositRequired() != null) rate.setDepositRequired(request.depositRequired());
        if (request.depositPercentage() != null) rate.setDepositPercentage(request.depositPercentage());
        if (request.notes() != null) rate.setNotes(request.notes());

        RoomRate saved = roomRateRepository.save(rate);
        audit.record(principal.id(), null, SecurityEventType.RATE_UPDATED, "RoomRate", "SUCCESS");
        return RateResponse.from(saved);
    }

    @Transactional
    public RateResponse updateStatus(StaffPrincipal principal, Long id, RateStatusRequest request) {
        if (!"MANAGER".equalsIgnoreCase(principal.role())) {
            throw new AccessDeniedException("Only managers can change rate status.");
        }

        RoomRate rate = roomRateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room Rate not found with ID: " + id));

        String newStatus = request.status().trim().toUpperCase();
        if (!"ACTIVE".equals(newStatus) && !"INACTIVE".equals(newStatus)) {
            throw new BusinessRuleException("Status must be ACTIVE or INACTIVE.");
        }

        rate.setStatus(newStatus);
        RoomRate saved = roomRateRepository.save(rate);

        SecurityEventType eventType = "ACTIVE".equals(newStatus) ? SecurityEventType.RATE_ACTIVATED : SecurityEventType.RATE_DEACTIVATED;
        audit.record(principal.id(), null, eventType, "RoomRate", "SUCCESS");
        return RateResponse.from(saved);
    }

    @Transactional
    public void deleteRate(StaffPrincipal principal, Long id) {
        if (!"MANAGER".equalsIgnoreCase(principal.role())) {
            throw new AccessDeniedException("Only managers can delete room rates.");
        }

        RoomRate rate = roomRateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room Rate not found with ID: " + id));

        if (reservationItemRepository.existsByRoomRateId(id)) {
            throw new ConflictException("This rate cannot be deleted because reservation history references it. Deactivate it instead.");
        }

        roomRateRepository.delete(rate);
        audit.record(principal.id(), null, SecurityEventType.RATE_DELETED, "RoomRate", "SUCCESS");
    }
}
