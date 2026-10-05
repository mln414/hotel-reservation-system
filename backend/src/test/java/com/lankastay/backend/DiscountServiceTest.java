package com.lankastay.backend;

import com.lankastay.backend.entity.Discount;
import com.lankastay.backend.repository.DiscountRepository;
import com.lankastay.backend.service.DiscountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DiscountServiceTest {

    @Mock
    private DiscountRepository discountRepository;

    @Mock private com.lankastay.backend.repository.HotelRepository hotels;
    @Mock private com.lankastay.backend.repository.StaffUserRepository staff;

    @InjectMocks
    private DiscountService discountService;

    private Discount sampleDiscount;

    @BeforeEach
    void setUp() {
        sampleDiscount = new Discount(
                301L,
                "SUMMER20",
                "Summer Getaway 20%",
                "20% off for 2+ nights",
                "PERCENTAGE",
                20.0,
                2,
                LocalDate.now().minusDays(5),
                LocalDate.now().plusDays(30),
                "ACTIVE"
        );
        sampleDiscount.setId(1L);
    }

    @Test
    @DisplayName("1. Retrieve all discounts for hotel")
    void testGetAllDiscountsForHotel() {
        when(discountRepository.findByHotelId(301L)).thenReturn(List.of(sampleDiscount));

        List<Discount> result = discountService.getAllDiscounts(301L);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("SUMMER20", result.get(0).getCode());
        verify(discountRepository, times(1)).findByHotelId(301L);
    }

    @Test
    @DisplayName("2. Validate active and applicable promo code")
    void testValidatePromoCodeSuccess() {
        when(discountRepository.findByCode("SUMMER20")).thenReturn(Optional.of(sampleDiscount));

        Optional<Discount> valid = discountService.validatePromoCode("SUMMER20", 301L, 3);

        assertTrue(valid.isPresent());
        assertEquals(20.0, valid.get().getDiscountValue());
    }

    @Test
    @DisplayName("3. Reject promo code when minimum nights not met")
    void testValidatePromoCodeMinimumNightsFail() {
        when(discountRepository.findByCode("SUMMER20")).thenReturn(Optional.of(sampleDiscount));

        Optional<Discount> invalid = discountService.validatePromoCode("SUMMER20", 301L, 1);

        assertFalse(invalid.isPresent(), "Discount requires 2 nights minimum");
    }

    @Test
    @DisplayName("4. Create new discount")
    void testCreateDiscount() {
        when(discountRepository.save(any(Discount.class))).thenReturn(sampleDiscount);

        when(hotels.existsById(301L)).thenReturn(true);
        Discount created = discountService.createDiscount(new com.lankastay.backend.dto.discount.CreateDiscountRequest(
                301L, "SUMMER20", "Summer Getaway 20%", "20% off for 2+ nights", "PERCENTAGE", 20.0, 2,
                sampleDiscount.getValidFrom(), sampleDiscount.getValidTo(), "ACTIVE"), manager());

        assertNotNull(created);
        assertEquals("SUMMER20", created.getCode());
        verify(discountRepository, times(1)).save(any(Discount.class));
    }

    @Test
    @DisplayName("5. Delete discount by ID")
    void testDeleteDiscount() {
        doNothing().when(discountRepository).deleteById(1L);

        when(discountRepository.findById(1L)).thenReturn(Optional.of(sampleDiscount));
        when(hotels.existsById(301L)).thenReturn(true);
        discountService.deleteDiscount(1L, manager());

        verify(discountRepository, times(1)).deleteById(1L);
    }

    private com.lankastay.backend.security.StaffPrincipal manager() {
        return new com.lankastay.backend.security.StaffPrincipal(java.util.UUID.randomUUID(), "manager@test.local", "",
                "MANAGER", com.lankastay.backend.entity.StaffStatus.ACTIVE, false, null, null, "M", "User");
    }
}
