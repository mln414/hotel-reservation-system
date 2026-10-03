package com.lankastay.backend;

import com.lankastay.backend.dto.offer.CreateOfferRequest;
import com.lankastay.backend.entity.Offer;
import com.lankastay.backend.entity.StaffStatus;
import com.lankastay.backend.exception.BusinessRuleException;
import com.lankastay.backend.repository.HotelRepository;
import com.lankastay.backend.repository.OfferRepository;
import com.lankastay.backend.repository.ReservationRepository;
import com.lankastay.backend.repository.RoomRepository;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.ManagementOfferService;
import com.lankastay.backend.service.SecurityAuditService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ManagementOfferServiceUnitTest {
    @Mock OfferRepository offerRepository;
    @Mock HotelRepository hotelRepository;
    @Mock RoomRepository roomRepository;
    @Mock ReservationRepository reservationRepository;
    @Mock SecurityAuditService audit;
    @InjectMocks ManagementOfferService service;

    private final StaffPrincipal manager = new StaffPrincipal(
            UUID.randomUUID(), "manager@example.com", "hash", "MANAGER", StaffStatus.ACTIVE,
            false, null, null, "Test", "Manager");

    @Test
    void omittedApplicableDaysUsesDocumentedAllDaysDefault() {
        when(offerRepository.existsBySlug("test-offer")).thenReturn(false);
        when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> {
            Offer saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        var response = service.createOffer(manager, request(null));

        assertEquals("MON,TUE,WED,THU,FRI,SAT,SUN", response.applicableDays());
    }

    @Test
    void restrictedDaysAreNormalized() {
        when(offerRepository.existsBySlug("test-offer")).thenReturn(false);
        when(offerRepository.save(any(Offer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.createOffer(manager, request(" fri, SAT "));

        assertEquals("FRI,SAT", response.applicableDays());
    }

    @Test
    void invalidOrDuplicateApplicableDaysAreRejectedBeforePersistence() {
        assertThrows(BusinessRuleException.class, () -> service.createOffer(manager, request("MON,FUNDAY")));
        assertThrows(BusinessRuleException.class, () -> service.createOffer(manager, request("MON,MON")));
        verify(offerRepository, never()).save(any());
    }

    private CreateOfferRequest request(String applicableDays) {
        return new CreateOfferRequest(
                "Test Offer", "Short description", "Full description", "PERCENTAGE", BigDecimal.TEN,
                "PER_STAY", LocalDate.of(2026, 9, 1), LocalDate.of(2026, 12, 31), null, null,
                1, null, applicableDays, "ACTIVE", false, 0, "/offer.jpg", List.of("Terms"), null,
                null, Set.of(), Set.of());
    }
}
