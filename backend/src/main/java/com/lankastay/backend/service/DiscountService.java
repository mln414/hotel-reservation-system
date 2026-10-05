package com.lankastay.backend.service;

import com.lankastay.backend.entity.Discount;
import com.lankastay.backend.repository.DiscountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class DiscountService {

    private final DiscountRepository discountRepository;
    private final com.lankastay.backend.repository.HotelRepository hotels;
    private final com.lankastay.backend.repository.StaffUserRepository staff;

    public DiscountService(DiscountRepository discountRepository, com.lankastay.backend.repository.HotelRepository hotels,
            com.lankastay.backend.repository.StaffUserRepository staff) {
        this.discountRepository = discountRepository;
        this.hotels = hotels;
        this.staff = staff;
    }

    @Transactional(readOnly = true)
    public List<Discount> getAllDiscounts(Long hotelId) {
        if (hotelId == null) {
            return discountRepository.findAll();
        }
        return discountRepository.findByHotelId(hotelId);
    }

    @Transactional(readOnly = true)
    public Optional<Discount> getDiscountById(Long id) {
        return discountRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Discount> getDiscountByCode(String code) {
        return discountRepository.findByCode(code);
    }

    @Transactional(readOnly = true)
    public Optional<Discount> validatePromoCode(String code, Long hotelId, Integer nights) {
        return discountRepository.findByCode(code)
                .filter(d -> "ACTIVE".equalsIgnoreCase(d.getStatus()))
                .filter(d -> d.getHotelId() == null || d.getHotelId().equals(hotelId))
                .filter(d -> nights == null || d.getMinimumNights() == null || nights >= d.getMinimumNights())
                .filter(d -> {
                    LocalDate today = LocalDate.now();
                    boolean afterStart = d.getValidFrom() == null || !today.isBefore(d.getValidFrom());
                    boolean beforeEnd = d.getValidTo() == null || !today.isAfter(d.getValidTo());
                    return afterStart && beforeEnd;
                });
    }

    @Transactional(readOnly = true)
    public List<Discount> listScoped(Long hotelId, com.lankastay.backend.security.StaffPrincipal principal) {
        if (!"MANAGER".equals(principal.role())) {
            hotelId = currentAssignment(principal);
            authorize(principal, hotelId, false);
        } else if (hotelId != null) authorize(principal, hotelId, false);
        return getAllDiscounts(hotelId);
    }

    @Transactional(readOnly = true)
    public Discount getScoped(Long id, com.lankastay.backend.security.StaffPrincipal principal) {
        Discount existing = discountRepository.findById(id).orElseThrow(() ->
                new com.lankastay.backend.exception.ResourceNotFoundException("Discount not found."));
        authorize(principal, existing.getHotelId(), false);
        return existing;
    }

    @Transactional
    public Discount createDiscount(com.lankastay.backend.dto.discount.CreateDiscountRequest request,
            com.lankastay.backend.security.StaffPrincipal principal) {
        Long hotelId = request.hotelId();
        if (!"MANAGER".equals(principal.role())) {
            Long assigned = currentAssignment(principal);
            if (hotelId != null && !hotelId.equals(assigned)) throw denied();
            hotelId = assigned;
        }
        authorize(principal, hotelId, true);
        Discount discount = new Discount();
        discount.setHotelId(hotelId);
        map(discount, request.code(), request.title(), request.description(), request.discountType(), request.discountValue(),
                request.minimumNights(), request.validFrom(), request.validTo(), request.status());
        return discountRepository.save(discount);
    }

    @Transactional
    public Discount updateDiscount(Long id, com.lankastay.backend.dto.discount.UpdateDiscountRequest request,
            com.lankastay.backend.security.StaffPrincipal principal) {
        Discount existing = discountRepository.findById(id).orElseThrow(() ->
                new com.lankastay.backend.exception.ResourceNotFoundException("Discount not found."));
        // Scope comes exclusively from the existing row, never the request body.
        authorize(principal, existing.getHotelId(), true);
        map(existing, request.code(), request.title(), request.description(), request.discountType(), request.discountValue(),
                request.minimumNights(), request.validFrom(), request.validTo(), request.status());
        return discountRepository.save(existing);
    }

    @Transactional
    public void deleteDiscount(Long id, com.lankastay.backend.security.StaffPrincipal principal) {
        if (principal == null || !"MANAGER".equals(principal.role())) throw denied();
        getScoped(id, principal);
        discountRepository.deleteById(id);
    }

    private Long currentAssignment(com.lankastay.backend.security.StaffPrincipal principal) {
        if (principal == null) throw denied();
        com.lankastay.backend.entity.StaffUser user = staff.findById(principal.id()).orElseThrow(this::denied);
        if (user.getAssignedHotelId() == null || user.getStatus() != com.lankastay.backend.entity.StaffStatus.ACTIVE
                || !user.getRole().name().equals(principal.role())) throw denied();
        return user.getAssignedHotelId();
    }

    private void authorize(com.lankastay.backend.security.StaffPrincipal principal, Long hotelId, boolean mutation) {
        if (principal == null) throw denied();
        if ("MANAGER".equals(principal.role())) {
            if (hotelId != null && !hotels.existsById(hotelId)) throw denied();
            return; // Managers retain documented global discounts (null hotel).
        }
        if (mutation && !"HOTEL_STAFF".equals(principal.role())) throw denied();
        if (!mutation && !java.util.Set.of("HOTEL_STAFF", "RECEPTIONIST").contains(principal.role())) throw denied();
        if (hotelId == null || !hotelId.equals(currentAssignment(principal)) || !hotels.existsById(hotelId)) throw denied();
    }

    private org.springframework.security.access.AccessDeniedException denied() {
        return new org.springframework.security.access.AccessDeniedException("Discount is outside your authorized hotel scope.");
    }

    private void map(Discount d, String code, String title, String description, String type, Double value,
            Integer nights, LocalDate from, LocalDate to, String status) {
        if (value == null || !Double.isFinite(value) || value <= 0 || ("PERCENTAGE".equals(type) && value > 100)
                || (from != null && to != null && to.isBefore(from))) {
            throw new com.lankastay.backend.exception.BusinessRuleException("Invalid discount value or validity dates.");
        }
        d.setCode(code.trim()); d.setTitle(title.trim()); d.setDescription(description);
        d.setDiscountType(type); d.setDiscountValue(value); d.setMinimumNights(nights == null ? 1 : nights);
        d.setValidFrom(from); d.setValidTo(to); d.setStatus(status);
    }
}
