package com.lankastay.backend;

import com.lankastay.backend.dto.reservation.CreateReservationRequest;
import com.lankastay.backend.dto.reservation.CancellationRequest;
import com.lankastay.backend.dto.room.CreateRoomRequest;
import com.lankastay.backend.dto.room.RoomGalleryItemDto;
import com.lankastay.backend.dto.room.RoomStatusRequest;
import com.lankastay.backend.dto.room.UpdateRoomRequest;
import com.lankastay.backend.dto.room.PhysicalRoomRequest;
import com.lankastay.backend.dto.room.PhysicalRoomBlockRequest;
import com.lankastay.backend.entity.*;
import com.lankastay.backend.exception.ConflictException;
import com.lankastay.backend.repository.*;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.CustomerReservationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class RoomManagementIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired RoomRepository rooms;
    @Autowired HotelRepository hotels;
    @Autowired RoomRateRepository rates;
    @Autowired ReservationRepository reservations;
    @Autowired ReservationItemRepository items;
    @Autowired RoomGalleryRepository gallery;
    @Autowired CustomerUserRepository customers;
    @Autowired StaffUserRepository staffUsers;
    @Autowired CustomerReservationService reservationService;
    @Autowired ReviewRepository reviews;
    @Autowired PhysicalRoomRepository physicalRooms;
    @Autowired PhysicalRoomBlockRepository physicalRoomBlocks;
    @Autowired ReservationPhysicalRoomRepository assignments;

    private final JsonMapper jsonMapper = JsonMapper.builder().build();

    private Hotel hotelA;
    private Hotel hotelB;
    private StaffPrincipal manager;
    private StaffPrincipal staffA;
    private StaffPrincipal staffB;
    private StaffPrincipal receptionistA;
    private CustomerUser customer;

    @BeforeEach
    void setup() {
        reviews.deleteAll();
        assignments.deleteAll();
        physicalRoomBlocks.deleteAll();
        gallery.deleteAll();
        items.deleteAll();
        reservations.deleteAll();
        rates.deleteAll();
        physicalRooms.deleteAll();
        rooms.deleteAll();
        hotels.deleteAll();
        customers.deleteAll();
        staffUsers.deleteAll();

        hotelA = createHotel("Hotel A Grand");
        hotelB = createHotel("Hotel B Resort");

        manager = createStaff("manager@lankastay.lk", StaffRole.MANAGER, null);
        staffA = createStaff("staffA@lankastay.lk", StaffRole.HOTEL_STAFF, hotelA.getId());
        staffB = createStaff("staffB@lankastay.lk", StaffRole.HOTEL_STAFF, hotelB.getId());
        receptionistA = createStaff("recA@lankastay.lk", StaffRole.RECEPTIONIST, hotelA.getId());

        CustomerUser c = new CustomerUser();
        c.setEmail("customer@example.com");
        c.setFirstName("Guest");
        c.setLastName("User");
        c.setPasswordHash("hash");
        c.setStatus("ACTIVE");
        customer = customers.save(c);
    }

    @Test
    void managerCreatesRoomSuccessfullyWithGeneratedSlug() throws Exception {
        CreateRoomRequest request = new CreateRoomRequest(
                hotelA.getId(),
                "Deluxe Ocean Suite",
                "SUITE",
                "Spacious suite with ocean panorama",
                3,
                2,
                1,
                55.0,
                "1 King Bed",
                5,
                35000.0,
                "/uploads/deluxe-ocean.jpg",
                "[\"free-wifi\",\"air-conditioning\"]",
                List.of(new RoomGalleryItemDto(null, "/uploads/deluxe-ocean.jpg", "Cover", 0, true))
        );

        String response = mvc.perform(post("/api/v1/management/rooms")
                        .with(user(manager)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Deluxe Ocean Suite"))
                .andExpect(jsonPath("$.slug").value("deluxe-ocean-suite"))
                .andExpect(jsonPath("$.status").value("INACTIVE"))
                .andExpect(jsonPath("$.inventoryCount").value(5))
                .andReturn().getResponse().getContentAsString();

        Long id = jsonMapper.readTree(response).get("id").asLong();
        Room persisted = rooms.findById(id).orElseThrow();
        assertThat(persisted.getHotelId()).isEqualTo(hotelA.getId());
        assertThat(persisted.getSlug()).isEqualTo("deluxe-ocean-suite");
        assertThat(gallery.findByRoomIdOrderByDisplayOrderAscIdAsc(id)).hasSize(1);
    }

    @Test
    void hotelStaffCannotCreateRoom() throws Exception {
        CreateRoomRequest request = new CreateRoomRequest(
                hotelA.getId(), "Standard Room", "STANDARD", "Desc",
                2, 2, 0, 30.0, "1 King Bed", 5, 20000.0,
                "/uploads/std.jpg", "[]", null
        );

        mvc.perform(post("/api/v1/management/rooms")
                        .with(user(staffA)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void hotelStaffCanEditAssignedHotelRoom() throws Exception {
        Room roomA = createRoom(hotelA, "Junior Suite", 5);

        UpdateRoomRequest update = new UpdateRoomRequest(
                "Junior Suite Renamed",
                "SUITE",
                "Updated description",
                2, 2, 0, 35.0, "1 Queen Bed", 5, 25000.0,
                "/uploads/new.jpg", "[]", null
        );

        mvc.perform(put("/api/v1/management/rooms/" + roomA.getId())
                        .with(user(staffA)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Junior Suite Renamed"));

        Room reloaded = rooms.findById(roomA.getId()).orElseThrow();
        assertThat(reloaded.getName()).isEqualTo("Junior Suite Renamed");
    }

    @Test
    void hotelStaffCannotEditOtherHotelRoom_IdorBlocked() throws Exception {
        Room roomB = createRoom(hotelB, "Boutique Room", 5);

        UpdateRoomRequest update = new UpdateRoomRequest(
                "Hacked Room Name",
                "STANDARD", "Desc", 2, 2, 0, 30.0, "King", 5, 10000.0,
                "/uploads/img.jpg", "[]", null
        );

        mvc.perform(put("/api/v1/management/rooms/" + roomB.getId())
                        .with(user(staffA)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(update)))
                .andExpect(status().isForbidden());

        Room untouched = rooms.findById(roomB.getId()).orElseThrow();
        assertThat(untouched.getName()).isEqualTo("Boutique Room");
    }

    @Test
    void receptionistCannotEditRoom() throws Exception {
        Room roomA = createRoom(hotelA, "Standard Room", 5);

        UpdateRoomRequest update = new UpdateRoomRequest(
                "Attempted Edit", "STANDARD", "Desc", 2, 2, 0, 30.0, "King", 5, 10000.0,
                "/uploads/img.jpg", "[]", null
        );

        mvc.perform(put("/api/v1/management/rooms/" + roomA.getId())
                        .with(user(receptionistA)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(update)))
                .andExpect(status().isForbidden());
    }

    @Test
    void inventoryReductionProtectionMatrix() throws Exception {
        // Given: room with inventory 5, and 4 rooms booked for future stay
        Room room = createRoom(hotelA, "Inventory Guard Suite", 5);
        RoomRate rate = createRate(hotelA, room, 15000.0);

        LocalDate checkIn = getDeterministicFutureMonday();
        LocalDate checkOut = checkIn.plusDays(2);
        createReservation(room, rate, checkIn, checkOut, 4);

        // 6 -> ALLOW
        UpdateRoomRequest req6 = updateReq(room, 6);
        mvc.perform(put("/api/v1/management/rooms/" + room.getId())
                .with(user(manager)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(req6))).andExpect(status().isOk());

        // 5 -> ALLOW
        UpdateRoomRequest req5 = updateReq(room, 5);
        mvc.perform(put("/api/v1/management/rooms/" + room.getId())
                .with(user(manager)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(req5))).andExpect(status().isOk());

        // 4 -> ALLOW
        UpdateRoomRequest req4 = updateReq(room, 4);
        mvc.perform(put("/api/v1/management/rooms/" + room.getId())
                .with(user(manager)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(req4))).andExpect(status().isOk());

        // 3 -> 409 Conflict
        UpdateRoomRequest req3 = updateReq(room, 3);
        mvc.perform(put("/api/v1/management/rooms/" + room.getId())
                        .with(user(manager)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(req3)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Inventory cannot be reduced below the quantity already reserved")));

        // 1 -> 409 Conflict
        UpdateRoomRequest req1 = updateReq(room, 1);
        mvc.perform(put("/api/v1/management/rooms/" + room.getId())
                        .with(user(manager)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(req1)))
                .andExpect(status().isConflict());

        // 0 -> 400 Bad Request (Min 1 Bean validation)
        UpdateRoomRequest req0 = updateReq(room, 0);
        mvc.perform(put("/api/v1/management/rooms/" + room.getId())
                        .with(user(manager)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(req0)))
                .andExpect(status().isBadRequest());

        // -1 -> 400 Bad Request
        UpdateRoomRequest reqNeg = updateReq(room, -1);
        mvc.perform(put("/api/v1/management/rooms/" + room.getId())
                        .with(user(manager)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(reqNeg)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void concurrentCustomerBookingVsManagerInventoryUpdateMaintainsInvariant() throws Exception {
        Room room = createRoom(hotelA, "Concurrency Suite", 5);
        RoomRate rate = createRate(hotelA, room, 10000.0);

        LocalDate checkIn = getDeterministicFutureMonday();
        LocalDate checkOut = checkIn.plusDays(2);
        // Already booked 4
        createReservation(room, rate, checkIn, checkOut, 4);

        // At nearly the same time:
        // Customer attempts to book 1 more (would bring total to 5)
        // Manager attempts to reduce inventory from 5 to 3 (which must fail if 4 are booked)
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        Callable<Boolean> customerTask = () -> {
            ready.countDown();
            start.await(5, TimeUnit.SECONDS);
            try {
                reservationService.create(customer.getId(), new CreateReservationRequest(
                        hotelA.getId(), room.getId(), rate.getId(), checkIn, checkOut, 1, 0,
                        1, "Guest", "Concurrent", "guest@example.com", "+94770000001", null, "14:00"
                ));
                return true;
            } catch (ConflictException e) {
                return false;
            }
        };

        Callable<Integer> managerTask = () -> {
            ready.countDown();
            start.await(5, TimeUnit.SECONDS);
            try {
                return mvc.perform(put("/api/v1/management/rooms/" + room.getId())
                                .with(user(manager)).with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(jsonMapper.writeValueAsString(updateReq(room, 3))))
                        .andReturn().getResponse().getStatus();
            } catch (Exception e) {
                return 500;
            }
        };

        Future<Boolean> customerFuture = executor.submit(customerTask);
        Future<Integer> managerFuture = executor.submit(managerTask);

        ready.await(5, TimeUnit.SECONDS);
        start.countDown();

        customerFuture.get(10, TimeUnit.SECONDS);
        int managerStatus = managerFuture.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        // Manager attempting inventory 3 MUST be rejected with 409 Conflict
        assertThat(managerStatus).isEqualTo(409);

        // Final invariant: max booked quantity on that night <= current inventory
        Room finalRoom = rooms.findById(room.getId()).orElseThrow();
        long bookedOnNight = items.bookedQuantityForNight(room.getId(), checkIn);
        assertThat(bookedOnNight).isLessThanOrEqualTo(finalRoom.getInventoryCount());
    }

    @Test
    void roomStatusActivationEnforcesReadinessAndExcludesIncompleteRooms() throws Exception {
        Room room = createRoom(hotelA, "Unready Room", 0); // inventory 0, no rate, no image
        room.setMainImage(null);
        room.setInventoryCount(0);
        rooms.save(room);

        // Activating unready room should fail with 400
        mvc.perform(patch("/api/v1/management/rooms/" + room.getId() + "/status")
                        .with(user(manager)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(new RoomStatusRequest("ACTIVE"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Cannot activate room")));

        // Supply missing requirements
        room.setInventoryCount(5);
        room.setMainImage("/uploads/ready.jpg");
        rooms.save(room);
        createRate(hotelA, room, 12000.0);

        // Now activate succeeds
        mvc.perform(patch("/api/v1/management/rooms/" + room.getId() + "/status")
                        .with(user(manager)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(new RoomStatusRequest("ACTIVE"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // Deactivating room sets it to INACTIVE
        mvc.perform(patch("/api/v1/management/rooms/" + room.getId() + "/status")
                        .with(user(manager)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(new RoomStatusRequest("INACTIVE"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }

    @Test
    void roomDeletionSafetyPreventsDestroyingReservationHistory() throws Exception {
        Room room = createRoom(hotelA, "Historical Room", 5);
        RoomRate rate = createRate(hotelA, room, 15000.0);

        LocalDate checkIn = getDeterministicFutureMonday();
        createReservation(room, rate, checkIn, checkIn.plusDays(2), 1);

        // Room with reservation history cannot be deleted
        mvc.perform(delete("/api/v1/management/rooms/" + room.getId())
                        .with(user(manager)).with(csrf()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("This room cannot be deleted because reservation history exists. Deactivate it instead."));

        // Unused room can be deleted
        Room unusedRoom = createRoom(hotelA, "Unused Room", 3);
        createRate(hotelA, unusedRoom, 10000.0);

        mvc.perform(delete("/api/v1/management/rooms/" + unusedRoom.getId())
                        .with(user(manager)).with(csrf()))
                .andExpect(status().isNoContent());

        assertThat(rooms.findById(unusedRoom.getId())).isEmpty();
    }

    @Test
    void physicalRoomPersistsAndDeleteAdjustsInventory() throws Exception {
        Room type = createRoom(hotelA, "Named Suite", 1);
        String payload = jsonMapper.writeValueAsString(new PhysicalRoomRequest(type.getId(), "A201", "2", "East", "AVAILABLE", "READY", "Test"));
        String created = mvc.perform(post("/api/v1/management/physical-rooms").with(user(manager)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.roomNumber").value("A201"))
                .andReturn().getResponse().getContentAsString();
        Long id = jsonMapper.readTree(created).get("id").asLong();
        mvc.perform(get("/api/v1/management/physical-rooms").with(user(manager)))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].roomNumber").value("A201"));
        mvc.perform(post("/api/v1/management/physical-rooms").with(user(manager)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/v1/management/physical-rooms").with(user(staffA)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/management/physical-rooms/" + id).with(user(manager)).with(csrf()))
                .andExpect(status().isNoContent());
        assertThat(physicalRooms.findById(id)).isEmpty();
        assertThat(rooms.findById(type.getId()).orElseThrow().getInventoryCount()).isZero();
    }

    @Test
    void legacyPhysicalRoomIdProtectsReservationHistoryFromDeleteAndRenumber() throws Exception {
        Room type = createRoom(hotelA, "Legacy Assignment Suite", 1);
        RoomRate rate = createRate(hotelA, type, 12000.0);
        String created = mvc.perform(post("/api/v1/management/physical-rooms").with(user(manager)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(jsonMapper.writeValueAsString(
                        new PhysicalRoomRequest(type.getId(), "L101", "1", null, "AVAILABLE", "READY", null))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long physicalId = jsonMapper.readTree(created).get("id").asLong();
        createReservation(type, rate, getDeterministicFutureMonday(), getDeterministicFutureMonday().plusDays(1), 1);
        Reservation reservation = reservations.findByHotelId(hotelA.getId()).get(0);
        reservation.setAssignedPhysicalRoomId(physicalId);
        reservations.saveAndFlush(reservation);

        mvc.perform(delete("/api/v1/management/physical-rooms/" + physicalId).with(user(manager)).with(csrf()))
                .andExpect(status().isConflict());
        mvc.perform(put("/api/v1/management/physical-rooms/" + physicalId).with(user(manager)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(jsonMapper.writeValueAsString(
                        new PhysicalRoomRequest(type.getId(), "L102", "1", null, "AVAILABLE", "READY", null))))
                .andExpect(status().isConflict());
        assertThat(physicalRooms.findById(physicalId)).isPresent();
        assertThat(reservations.findById(reservation.getId()).orElseThrow().getAssignedPhysicalRoomId()).isEqualTo(physicalId);
    }

    @Test
    void permanentDeletesRequireManagerAndCorrectHotelScope() throws Exception {
        Room type = createRoom(hotelB, "Protected Suite", 1);
        String created = mvc.perform(post("/api/v1/management/physical-rooms").with(user(manager)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(jsonMapper.writeValueAsString(
                        new PhysicalRoomRequest(type.getId(), "B101", "1", null, "AVAILABLE", "READY", null))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long physicalId = jsonMapper.readTree(created).get("id").asLong();
        StaffPrincipal hotelAManager = createStaff("hotel-a-manager@lankastay.lk", StaffRole.MANAGER, hotelA.getId());
        for (StaffPrincipal unauthorized : List.of(staffA, hotelAManager)) {
            mvc.perform(delete("/api/v1/management/physical-rooms/" + physicalId).with(user(unauthorized)).with(csrf()))
                    .andExpect(status().isForbidden());
            mvc.perform(delete("/api/v1/management/rooms/" + type.getId()).with(user(unauthorized)).with(csrf()))
                    .andExpect(status().isForbidden());
        }
        assertThat(physicalRooms.findById(physicalId)).isPresent();
        assertThat(rooms.findById(type.getId())).isPresent();
    }

    @Test
    void physicalRoomBlockReducesAvailabilityAndAssignmentRejectsOverlap() throws Exception {
        Room type = createRoom(hotelA, "Assignment Suite", 2);
        RoomRate rate = createRate(hotelA, type, 12000.0);
        LocalDate checkIn = getDeterministicFutureMonday();
        LocalDate checkOut = checkIn.plusDays(2);
        String first = mvc.perform(post("/api/v1/management/physical-rooms").with(user(manager)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(jsonMapper.writeValueAsString(
                        new PhysicalRoomRequest(type.getId(), "201", "2", null, "AVAILABLE", "READY", null))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long physicalId = jsonMapper.readTree(first).get("id").asLong();
        String reservationOne = reservationService.create(customer.getId(), new CreateReservationRequest(
                hotelA.getId(), type.getId(), rate.getId(), checkIn, checkOut, 2, 0, 1,
                "Guest", "One", "guest@example.com", null, null, null)).reservationCode();
        Long firstId = reservations.findByReservationCode(reservationOne).orElseThrow().getId();
        mvc.perform(patch("/api/v1/management/reservations/" + firstId + "/assign-room")
                .with(user(manager)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"roomNumber\":\"201\"}"))
                .andExpect(status().isOk());
        assertThat(reservations.findById(firstId).orElseThrow().getAssignedPhysicalRoomId()).isEqualTo(physicalId);
        mvc.perform(delete("/api/v1/management/rooms/" + type.getId()).with(user(manager)).with(csrf()))
                .andExpect(status().isConflict());
        String reservationTwo = reservationService.create(customer.getId(), new CreateReservationRequest(
                hotelA.getId(), type.getId(), rate.getId(), checkIn, checkOut, 2, 0, 1,
                "Guest", "Two", "guest@example.com", null, null, null)).reservationCode();
        Long secondId = reservations.findByReservationCode(reservationTwo).orElseThrow().getId();
        mvc.perform(patch("/api/v1/management/reservations/" + secondId + "/assign-room")
                .with(user(manager)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"roomNumber\":\"201\"}"))
                .andExpect(status().isConflict());
        mvc.perform(delete("/api/v1/management/physical-rooms/" + physicalId).with(user(manager)).with(csrf()))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/v1/management/physical-rooms/" + physicalId + "/blocks")
                .with(user(manager)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(new PhysicalRoomBlockRequest("MAINTENANCE", "Repair", checkIn, checkOut.minusDays(1), "AVAILABLE"))))
                .andExpect(status().isConflict());
    }

    @Test
    void scheduledMaintenanceRemovesCapacityOnlyForItsDates() throws Exception {
        Room type = createRoom(hotelA, "Maintenance Suite", 1);
        LocalDate firstNight = getDeterministicFutureMonday();
        String created = mvc.perform(post("/api/v1/management/physical-rooms").with(user(manager)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(jsonMapper.writeValueAsString(
                        new PhysicalRoomRequest(type.getId(), "501", "5", null, "AVAILABLE", "READY", null))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long id = jsonMapper.readTree(created).get("id").asLong();
        mvc.perform(post("/api/v1/management/physical-rooms/" + id + "/blocks")
                .with(user(manager)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(jsonMapper.writeValueAsString(new PhysicalRoomBlockRequest("MAINTENANCE", "Repair", firstNight, firstNight, "AVAILABLE"))))
                .andExpect(status().isCreated());
        assertThat(reservationService.availability(hotelA.getId(), type.getId(), firstNight, firstNight.plusDays(1), 1).available()).isFalse();
        assertThat(reservationService.availability(hotelA.getId(), type.getId(), firstNight.plusDays(1), firstNight.plusDays(2), 1).available()).isTrue();
    }

    @Test
    void namedRoomReservationCancellationRestoresAvailabilityButKeepsHistory() throws Exception {
        Room type = createRoom(hotelA, "Single Named Room", 1);
        RoomRate rate = createRate(hotelA, type, 14000.0);
        String created = mvc.perform(post("/api/v1/management/physical-rooms").with(user(manager)).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(jsonMapper.writeValueAsString(
                        new PhysicalRoomRequest(type.getId(), "601", "6", null, "AVAILABLE", "READY", null))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long physicalId = jsonMapper.readTree(created).get("id").asLong();
        LocalDate checkIn = getDeterministicFutureMonday();
        LocalDate checkOut = checkIn.plusDays(2);
        var request = new CreateReservationRequest(hotelA.getId(), type.getId(), rate.getId(), checkIn, checkOut,
                2, 0, 1, "Guest", "Stay", "guest@example.com", null, null, null);
        assertThat(reservationService.availability(hotelA.getId(), type.getId(), checkIn, checkOut, 1).available()).isTrue();
        var saved = reservationService.create(customer.getId(), request);
        mvc.perform(patch("/api/v1/management/reservations/" + saved.id() + "/assign-room")
                .with(user(manager)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"roomNumber\":\"601\"}"))
                .andExpect(status().isOk());
        assertThat(reservationService.availability(hotelA.getId(), type.getId(), checkIn, checkOut, 1).available()).isFalse();
        assertThat(reservationService.availability(hotelA.getId(), type.getId(), checkOut, checkOut.plusDays(1), 1).available()).isTrue();
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> reservationService.create(customer.getId(), request))
                .isInstanceOf(ConflictException.class);
        reservationService.cancel(customer.getId(), saved.id(), new CancellationRequest("Change of plans", null));
        assertThat(reservationService.availability(hotelA.getId(), type.getId(), checkIn, checkOut, 1).available()).isTrue();
        assertThat(reservations.findById(saved.id()).orElseThrow().getAssignedPhysicalRoomId()).isEqualTo(physicalId);
        mvc.perform(delete("/api/v1/management/physical-rooms/" + physicalId).with(user(manager)).with(csrf()))
                .andExpect(status().isConflict());
    }

    @Test
    void multiUnitReservationKeepsTwoAssignmentsAcrossReloadAndSupportsSingleRemoval() throws Exception {
        Room type = createRoom(hotelA, "Twin Allocation", 2);
        RoomRate rate = createRate(hotelA, type, 10000.0);
        for (String number : List.of("701", "702")) {
            mvc.perform(post("/api/v1/management/physical-rooms").with(user(manager)).with(csrf())
                    .contentType(MediaType.APPLICATION_JSON).content(jsonMapper.writeValueAsString(
                            new PhysicalRoomRequest(type.getId(), number, "7", null, "AVAILABLE", "READY", null))))
                    .andExpect(status().isCreated());
        }
        LocalDate checkIn = getDeterministicFutureMonday();
        var saved = reservationService.create(customer.getId(), new CreateReservationRequest(
                hotelA.getId(), type.getId(), rate.getId(), checkIn, checkIn.plusDays(2), 2, 0, 2,
                "Guest", "Two Rooms", "guest@example.com", null, null, null));
        mvc.perform(patch("/api/v1/management/reservations/" + saved.id() + "/assign-room")
                .with(user(manager)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"roomNumber\":\"701\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.assignmentState").value("PARTIALLY_ASSIGNED"))
                .andExpect(jsonPath("$.assignedPhysicalRoomIds.length()").value(1));
        mvc.perform(patch("/api/v1/management/reservations/" + saved.id() + "/assign-room")
                .with(user(manager)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"roomNumber\":\"702\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.assignmentState").value("ASSIGNED"))
                .andExpect(jsonPath("$.assignedPhysicalRoomIds.length()").value(2));
        mvc.perform(get("/api/v1/management/reservations/" + saved.id()).with(user(manager)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.assignedPhysicalRoomIds.length()").value(2));
        mvc.perform(patch("/api/v1/management/reservations/" + saved.id() + "/assign-room")
                .with(user(manager)).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"roomNumber\":\"701\",\"remove\":true}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.assignmentState").value("PARTIALLY_ASSIGNED"))
                .andExpect(jsonPath("$.assignedPhysicalRoomIds.length()").value(1));
        assertThat(assignments.countByReservationId(saved.id())).isEqualTo(1);
    }

    @Test
    void roomRateCrossPropertyMismatchIsRejected() throws Exception {
        Room roomB = createRoom(hotelB, "Hotel B Room", 5);

        // Attempting to create rate combining Hotel A with Room B (from Hotel B)
        RoomRate mismatchedRate = new RoomRate(
                hotelA.getId(),
                roomB.getId(),
                "Invalid Cross Rate",
                "CROSS",
                10000.0,
                12000.0,
                "ROOM_ONLY",
                "FLEXIBLE_24H",
                false,
                0.0,
                "ACTIVE"
        );

        mvc.perform(post("/api/v1/management/rates")
                        .with(user(manager)).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(mismatchedRate)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Cross-property mismatch")));
    }

    private Hotel createHotel(String name) {
        Hotel h = new Hotel();
        h.setName(name);
        h.setSlug(name.toLowerCase().replace(' ', '-') + "-" + UUID.randomUUID().toString().substring(0, 8));
        h.setDestinationId(1L);
        h.setPropertyType("Hotel");
        h.setStatus("ACTIVE");
        h.setSetupStatus("COMPLETE");
        h.setPublicationStatus("ACTIVE");
        h.setPrice(BigDecimal.valueOf(10000));
        return hotels.save(h);
    }

    private Room createRoom(Hotel h, String name, int inventory) {
        Room r = new Room(
                h.getId(), name, name.toLowerCase().replace(' ', '-') + "-" + UUID.randomUUID().toString().substring(0, 8),
                "STANDARD", "Description for " + name, 2, 2, 0, 30.0,
                "1 King Bed", inventory, 20000.0, "ACTIVE", "/uploads/room.jpg", "[]"
        );
        return rooms.save(r);
    }

    private RoomRate createRate(Hotel h, Room r, double price) {
        RoomRate rr = new RoomRate(
                h.getId(), r.getId(), "Standard Rate", "STD", price, price,
                "ROOM_ONLY", "FLEXIBLE_24H", false, 0.0, "ACTIVE"
        );
        return rates.save(rr);
    }

    private void createReservation(Room r, RoomRate rate, LocalDate in, LocalDate out, int quantity) {
        reservationService.create(customer.getId(), new CreateReservationRequest(
                r.getHotelId(), r.getId(), rate.getId(), in, out, 2, 0,
                quantity, "Guest", "History", "guest@example.com", "+94770000000", null, "14:00"
        ));
    }

    private UpdateRoomRequest updateReq(Room r, int newInventory) {
        return new UpdateRoomRequest(
                r.getName(), r.getRoomCategory(), r.getDescription(),
                r.getMaxOccupancy(), r.getMaxAdults(), r.getMaxChildren(),
                r.getSizeSqm(), r.getBedType(), newInventory, r.getBasePrice(),
                r.getMainImage(), r.getAmenitiesJson(), null
        );
    }

    private LocalDate getDeterministicFutureMonday() {
        LocalDate date = LocalDate.now().plusDays(30);
        while (date.getDayOfWeek() != DayOfWeek.MONDAY) {
            date = date.plusDays(1);
        }
        return date;
    }

    private StaffPrincipal createStaff(String email, StaffRole role, Long assignedHotelId) {
        StaffUser user = new StaffUser();
        user.setEmail(email);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setRole(role);
        user.setStatus(StaffStatus.ACTIVE);
        user.setAssignedHotelId(assignedHotelId);
        user.setMustChangePassword(false);
        user.setPasswordHash("hashed_password");
        StaffUser saved = staffUsers.saveAndFlush(user);
        return StaffPrincipal.from(saved);
    }
}
