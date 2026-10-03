package com.lankastay.backend;

import com.lankastay.backend.dto.rate.CreateRateRequest;
import com.lankastay.backend.dto.rate.RateResponse;
import com.lankastay.backend.dto.rate.UpdateRateRequest;
import com.lankastay.backend.entity.Hotel;
import com.lankastay.backend.entity.Room;
import com.lankastay.backend.entity.RoomRate;
import com.lankastay.backend.entity.StaffStatus;
import com.lankastay.backend.repository.HotelRepository;
import com.lankastay.backend.repository.ReservationItemRepository;
import com.lankastay.backend.repository.RoomRateRepository;
import com.lankastay.backend.repository.RoomRepository;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.ManagementRateService;
import com.lankastay.backend.service.SecurityAuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ManagementRateServiceTest {
    @Mock private RoomRateRepository roomRateRepository;
    @Mock private RoomRepository roomRepository;
    @Mock private HotelRepository hotelRepository;
    @Mock private ReservationItemRepository reservationItemRepository;
    @Mock private SecurityAuditService audit;
    @InjectMocks private ManagementRateService rateService;

    private RoomRate sampleRate;
    private StaffPrincipal manager;

    @BeforeEach
    void setUp() {
        manager = new StaffPrincipal(UUID.randomUUID(), "manager@example.com", "hash", "MANAGER",
                StaffStatus.ACTIVE, false, null, null, "Test", "Manager");
        sampleRate = new RoomRate(301L, 101L, "Standard Flexible Rate", "FLEX-BB",
                new BigDecimal("38500.00"), new BigDecimal("42000.00"), "BED_AND_BREAKFAST",
                "FLEXIBLE_24H", false, BigDecimal.ZERO, "ACTIVE");
        sampleRate.setId(1L);
    }

    @Test
    @DisplayName("1. Retrieve rates for specific hotel")
    void testGetRatesForHotel() {
        when(roomRateRepository.findByHotelId(301L)).thenReturn(List.of(sampleRate));
        List<RateResponse> rates = rateService.getRatesForHotel(manager, 301L);
        assertEquals(1, rates.size());
        assertEquals("Standard Flexible Rate", rates.get(0).ratePlanName());
        verify(roomRateRepository).findByHotelId(301L);
    }

    @Test
    @DisplayName("2. Retrieve rates for specific room")
    void testGetRatesForRoom() {
        Room room = mock(Room.class);
        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));
        when(roomRateRepository.findByRoomId(101L)).thenReturn(List.of(sampleRate));
        List<RateResponse> rates = rateService.getRatesForRoom(manager, 101L);
        assertEquals(1, rates.size());
        assertEquals("FLEX-BB", rates.get(0).ratePlanCode());
    }

    @Test
    @DisplayName("3. Retrieve rate by ID")
    void testGetRateById() {
        when(roomRateRepository.findById(1L)).thenReturn(Optional.of(sampleRate));
        Optional<RateResponse> rate = rateService.getRateById(manager, 1L);
        assertTrue(rate.isPresent());
        assertEquals(new BigDecimal("38500.00"), rate.get().baseNightlyRate());
    }

    @Test
    @DisplayName("4. Create new room rate plan")
    void testCreateRate() {
        Hotel hotel = mock(Hotel.class);
        Room room = mock(Room.class);
        when(hotelRepository.findById(301L)).thenReturn(Optional.of(hotel));
        when(roomRepository.findById(101L)).thenReturn(Optional.of(room));
        when(room.getHotelId()).thenReturn(301L);
        when(roomRateRepository.existsByHotelIdAndRoomIdAndRatePlanCodeIgnoreCase(301L, 101L, "FLEX-BB"))
                .thenReturn(false);
        when(roomRateRepository.save(any(RoomRate.class))).thenReturn(sampleRate);
        RateResponse created = rateService.createRate(manager, createRequest());
        assertEquals(1L, created.id());
        assertEquals("ACTIVE", created.status());
        verify(roomRateRepository).save(any(RoomRate.class));
    }

    @Test
    @DisplayName("5. Update existing room rate plan")
    void testUpdateRate() {
        when(roomRateRepository.findById(1L)).thenReturn(Optional.of(sampleRate));
        when(roomRateRepository.existsByHotelIdAndRoomIdAndRatePlanCodeIgnoreCaseAndIdNot(301L, 101L, "UPD-01", 1L))
                .thenReturn(false);
        when(roomRateRepository.save(any(RoomRate.class))).thenAnswer(invocation -> invocation.getArgument(0));
        RateResponse updated = rateService.updateRate(manager, 1L, updateRequest());
        assertEquals("Updated Plan", updated.ratePlanName());
        assertEquals(new BigDecimal("45000.00"), updated.baseNightlyRate());
        assertEquals("HALF_BOARD", updated.mealPlan());
        assertTrue(updated.depositRequired());
    }

    @Test
    @DisplayName("6. Delete rate by ID")
    void testDeleteRate() {
        when(roomRateRepository.findById(1L)).thenReturn(Optional.of(sampleRate));
        when(reservationItemRepository.existsByRoomRateId(1L)).thenReturn(false);
        rateService.deleteRate(manager, 1L);
        verify(roomRateRepository).delete(sampleRate);
    }

    private CreateRateRequest createRequest() {
        return new CreateRateRequest(301L, 101L, "Standard Flexible Rate", "FLEX-BB", "BASE", "SET_PRICE",
                new BigDecimal("38500.00"), new BigDecimal("42000.00"), null, null, 1, null,
                "BED_AND_BREAKFAST", "FLEXIBLE_24H", false, BigDecimal.ZERO, null);
    }

    private UpdateRateRequest updateRequest() {
        return new UpdateRateRequest("Updated Plan", "UPD-01", "BASE", "SET_PRICE",
                new BigDecimal("45000.00"), new BigDecimal("48000.00"), null, null, 1, null,
                "HALF_BOARD", "NON_REFUNDABLE", true, new BigDecimal("20.00"), null);
    }
}
