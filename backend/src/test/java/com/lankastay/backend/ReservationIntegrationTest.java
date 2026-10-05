package com.lankastay.backend;

import com.lankastay.backend.dto.reservation.*;
import com.lankastay.backend.entity.*;
import com.lankastay.backend.exception.ApiException;
import com.lankastay.backend.exception.ConflictException;
import com.lankastay.backend.repository.*;
import com.lankastay.backend.security.StaffPrincipal;
import com.lankastay.backend.service.CustomerReservationService;
import com.lankastay.backend.service.ManagementReservationService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockHttpSession;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ReservationIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired CustomerReservationService customerService;
    @Autowired ManagementReservationService managementService;
    @Autowired ReservationRepository reservations;
    @Autowired ReservationItemRepository items;
    @Autowired RoomRateRepository rates;
    @Autowired RoomRepository rooms;
    @Autowired HotelRepository hotels;
    @Autowired CustomerUserRepository customers;
    @Autowired ReviewRepository reviews;
    @Autowired ReservationPhysicalRoomRepository assignments;

    private CustomerUser customerA;
    private CustomerUser customerB;
    private Hotel hotel;
    private Room room;
    private RoomRate rate;
    private LocalDate base;

    @BeforeEach
    void setup() {
        reviews.deleteAll();
        items.deleteAll(); reservations.deleteAll(); rates.deleteAll(); rooms.deleteAll(); hotels.deleteAll(); customers.deleteAll();
        customerA = customer("a@example.com");
        customerB = customer("b@example.com");
        hotel = hotel("Hotel A");
        room = room(hotel, 1);
        rate = rate(hotel, room, 10_000, 12_000);
        base = LocalDate.now().plusDays(30);
        while (base.getDayOfWeek() != java.time.DayOfWeek.MONDAY) {
            base = base.plusDays(1);
        }
    }

    @Test
    void createsPersistentReservationWithUuidOwnershipAndServerPrice() {
        ReservationResponse saved = create(customerA, room, rate, base, base.plusDays(2), 1);
        assertThat(saved.reservationCode()).startsWith("LS-" + LocalDate.now().getYear());
        assertThat(saved.totalAmount()).isEqualByComparingTo("20000.00");
        Reservation persisted = reservations.findById(saved.id()).orElseThrow();
        assertThat(persisted.getCustomerId()).isEqualTo(customerA.getId());
        assertThat(items.findByReservationId(saved.id())).singleElement()
                .satisfies(item -> {
                    assertThat(item.getRoomId()).isEqualTo(room.getId());
                    assertThat(item.getRoomRateId()).isEqualTo(rate.getId());
                    assertThat(item.getTotalPrice()).isEqualByComparingTo("20000.00");
                });
    }

    @Test
    void customerApiRequiresSessionIgnoresPriceTamperingAndHidesOtherCustomersReservation() throws Exception {
        MockHttpSession sessionA = customerSession(customerA);
        String json = """
                {"hotelId":%d,"roomId":%d,"rateId":%d,"checkIn":"%s","checkOut":"%s",
                 "adults":1,"children":0,"quantity":1,"guestFirstName":"Api","guestLastName":"Guest",
                 "guestEmail":"api@example.com","totalAmount":1,"nightlyRate":1,"discountValue":999999}
                """.formatted(hotel.getId(), room.getId(), rate.getId(), base, base.plusDays(2));
        String response = mvc.perform(post("/api/v1/customer/reservations").session(sessionA).with(csrf())
                        .contentType("application/json").content(json))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.totalAmount").value(20000.0))
                .andReturn().getResponse().getContentAsString();
        Long id = tools.jackson.databind.json.JsonMapper.builder().build().readTree(response).get("id").asLong();

        mvc.perform(get("/api/v1/customer/reservations/" + id).session(customerSession(customerB)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/customer/reservations")).andExpect(status().isUnauthorized());
    }

    @Test
    void availabilityDiscoveryIsPublicButReservationWritesStillRequireASession() throws Exception {
        mvc.perform(get("/api/v1/customer/reservations/availability")
                        .param("hotelId", hotel.getId().toString())
                        .param("roomId", room.getId().toString())
                        .param("checkIn", base.toString())
                        .param("checkOut", base.plusDays(2).toString())
                        .param("quantity", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(true));

        mvc.perform(post("/api/v1/customer/reservations")
                        .contentType("application/json").content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void validatesDatesCapacityHotelRoomAndRateRelationships() {
        assertThatThrownBy(() -> create(customerA, room, rate, base, base, 1)).isInstanceOf(ApiException.class);
        CreateReservationRequest excessGuests = request(room, rate, base, base.plusDays(1), 1, 3, 0);
        assertThatThrownBy(() -> customerService.create(customerA.getId(), excessGuests)).isInstanceOf(ApiException.class);

        Hotel otherHotel = hotel("Hotel B");
        Room otherRoom = room(otherHotel, 1);
        RoomRate otherRate = rate(otherHotel, otherRoom, 1_000, 1_000);
        CreateReservationRequest crossHotelRoom = new CreateReservationRequest(hotel.getId(), otherRoom.getId(), otherRate.getId(),
                base, base.plusDays(1), 1, 0, 1, "A", "Guest", "a@example.com", null, null, null);
        assertThatThrownBy(() -> customerService.create(customerA.getId(), crossHotelRoom)).isInstanceOf(ApiException.class);

        CreateReservationRequest crossRate = request(room, otherRate, base, base.plusDays(1), 1, 1, 0);
        assertThatThrownBy(() -> customerService.create(customerA.getId(), crossRate)).isInstanceOf(ApiException.class);
        hotel.setPublicationStatus("INACTIVE"); hotels.save(hotel);
        assertThatThrownBy(() -> create(customerA, room, rate, base, base.plusDays(1), 1)).isInstanceOf(ApiException.class);
    }

    @TestFactory
    Collection<DynamicTest> overlapBoundaryMatrix() {
        record Case(int start, int end, boolean allowed) {}
        List<Case> cases = List.of(new Case(10, 12, false), new Case(11, 13, false), new Case(9, 11, false),
                new Case(9, 13, false), new Case(10, 11, false), new Case(12, 14, true), new Case(8, 10, true));
        return cases.stream().map(testCase -> DynamicTest.dynamicTest(testCase.start + " to " + testCase.end, () -> {
            items.deleteAll(); reservations.deleteAll();
            LocalDate anchor = base.plusDays(10);
            create(customerA, room, rate, anchor, anchor.plusDays(2), 1);
            LocalDate requestedStart = base.plusDays(testCase.start);
            LocalDate requestedEnd = base.plusDays(testCase.end);
            if (testCase.allowed) assertThatCode(() -> create(customerB, room, rate, requestedStart, requestedEnd, 1)).doesNotThrowAnyException();
            else assertThatThrownBy(() -> create(customerB, room, rate, requestedStart, requestedEnd, 1)).isInstanceOf(ConflictException.class);
        })).toList();
    }

    @Test
    void quantityIsCheckedForEveryNightAndCancellationReleasesInventory() {
        room.setInventoryCount(3); rooms.save(room);
        ReservationResponse first = create(customerA, room, rate, base, base.plusDays(3), 2);
        assertThatCode(() -> create(customerB, room, rate, base.plusDays(1), base.plusDays(2), 1)).doesNotThrowAnyException();
        assertThatThrownBy(() -> create(customerB, room, rate, base, base.plusDays(1), 2)).isInstanceOf(ConflictException.class);

        customerService.cancel(customerA.getId(), first.id(), new CancellationRequest("Change of plans", null));
        assertThat(reservations.findById(first.id()).orElseThrow().getReservationStatus()).isEqualTo(ReservationStatus.CANCELLED);
        assertThatCode(() -> create(customerB, room, rate, base, base.plusDays(1), 2)).doesNotThrowAnyException();
    }

    @Test
    void customerCanPermanentlyDeleteOnlyTheirCancelledReservation() {
        ReservationResponse saved = create(customerA, room, rate, base, base.plusDays(2), 1);
        ReservationPhysicalRoom assignment = new ReservationPhysicalRoom();
        assignment.setReservationId(saved.id());
        assignment.setPhysicalRoomId(999L);
        assignments.save(assignment);
        assertThat(assignments.countByReservationId(saved.id())).isOne();
        int beforeBooking = customerService.availability(hotel.getId(), room.getId(), base, base.plusDays(2), 1).availableQuantity();

        assertThatThrownBy(() -> customerService.delete(customerA.getId(), saved.id()))
                .isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> customerService.delete(customerB.getId(), saved.id()))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(org.springframework.http.HttpStatus.NOT_FOUND);

        customerService.cancel(customerA.getId(), saved.id(), new CancellationRequest("Change of plans", null));
        int afterCancel = customerService.availability(hotel.getId(), room.getId(), base, base.plusDays(2), 1).availableQuantity();
        customerService.delete(customerA.getId(), saved.id());

        assertThat(reservations.findById(saved.id())).isEmpty();
        assertThat(items.findByReservationId(saved.id())).isEmpty();
        assertThat(assignments.countByReservationId(saved.id())).isZero();
        assertThat(afterCancel).isEqualTo(beforeBooking + 1);
        assertThat(customerService.availability(hotel.getId(), room.getId(), base, base.plusDays(2), 1).availableQuantity())
                .isEqualTo(afterCancel);
        assertThatThrownBy(() -> customerService.delete(customerA.getId(), saved.id()))
                .isInstanceOf(ApiException.class)
                .extracting("status").isEqualTo(org.springframework.http.HttpStatus.NOT_FOUND);
    }

    @Test
    void completedReservationCannotBePermanentlyDeleted() {
        ReservationResponse saved = create(customerA, room, rate, base, base.plusDays(2), 1);
        Reservation completed = reservations.findById(saved.id()).orElseThrow();
        completed.setReservationStatus(ReservationStatus.COMPLETED);
        reservations.save(completed);

        assertThatThrownBy(() -> customerService.delete(customerA.getId(), saved.id()))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Only cancelled reservations");
        assertThat(reservations.findById(saved.id())).isPresent();
    }

    @Test
    void customerDeleteEndpointEnforcesStatusAndOwnershipThenReturnsNoContent() throws Exception {
        ReservationResponse saved = create(customerA, room, rate, base, base.plusDays(2), 1);

        mvc.perform(delete("/api/v1/customer/reservations/" + saved.id()).session(customerSession(customerA)).with(csrf()))
                .andExpect(status().isConflict());
        mvc.perform(delete("/api/v1/customer/reservations/" + saved.id()).session(customerSession(customerB)).with(csrf()))
                .andExpect(status().isNotFound());

        customerService.cancel(customerA.getId(), saved.id(), new CancellationRequest("Change of plans", null));
        mvc.perform(delete("/api/v1/customer/reservations/" + saved.id()).session(customerSession(customerA)).with(csrf()))
                .andExpect(status().isNoContent());
        assertThat(reservations.findById(saved.id())).isEmpty();
    }

    @Test
    void unsupportedCustomerReservationEditReturnsMethodNotAllowedInsteadOfServerError() throws Exception {
        ReservationResponse saved = create(customerA, room, rate, base, base.plusDays(2), 1);

        mvc.perform(patch("/api/v1/customer/reservations/" + saved.id())
                        .session(customerSession(customerA)).with(csrf())
                        .contentType("application/json")
                        .content("{\"specialRequests\":\"Unsupported edit probe\"}"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.status").value(405))
                .andExpect(jsonPath("$.error").value("Method Not Allowed"));
        assertThat(reservations.findById(saved.id()).orElseThrow().getSpecialRequests()).isNull();
    }

    @Test
    void paidCancelledReservationIsPreservedForFinancialSafety() {
        ReservationResponse saved = create(customerA, room, rate, base, base.plusDays(2), 1);
        customerService.cancel(customerA.getId(), saved.id(), new CancellationRequest("Change of plans", null));
        Reservation paid = reservations.findById(saved.id()).orElseThrow();
        paid.setPaymentStatus(PaymentStatus.PAID);
        reservations.save(paid);

        assertThatThrownBy(() -> customerService.delete(customerA.getId(), saved.id()))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("paid or partially paid");
        assertThat(reservations.findById(saved.id())).isPresent();
    }

    @Test
    void customerOwnershipAndStaffHotelScopePreventIdor() {
        ReservationResponse saved = create(customerA, room, rate, base, base.plusDays(1), 1);
        assertThatThrownBy(() -> customerService.get(customerB.getId(), saved.id()))
                .isInstanceOf(ApiException.class).extracting("status").isEqualTo(org.springframework.http.HttpStatus.NOT_FOUND);

        StaffPrincipal receptionist = new StaffPrincipal(UUID.randomUUID(), "r@example.com", "x", "RECEPTIONIST",
                StaffStatus.ACTIVE, false, null, hotel.getId() + 999, "R", "Staff");
        assertThatThrownBy(() -> managementService.get(receptionist, saved.id()))
                .isInstanceOf(ApiException.class).extracting("status").isEqualTo(org.springframework.http.HttpStatus.FORBIDDEN);
    }

    @Test
    void statusStateMachineRejectsResurrection() {
        ReservationResponse saved = create(customerA, room, rate, base, base.plusDays(1), 1);
        StaffPrincipal manager = new StaffPrincipal(UUID.randomUUID(), "m@example.com", "x", "MANAGER",
                StaffStatus.ACTIVE, false, null, null, "M", "Manager");
        managementService.updateStatus(manager, saved.id(), new ReservationStatusRequest(ReservationStatus.CANCELLED, null));
        assertThatThrownBy(() -> managementService.updateStatus(manager, saved.id(), new ReservationStatusRequest(ReservationStatus.CONFIRMED, null)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void concurrentFinalRoomBookingAllowsExactlyOneWinner() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        Callable<Boolean> bookingA = concurrentBooking(customerA, ready, start);
        Callable<Boolean> bookingB = concurrentBooking(customerB, ready, start);
        Future<Boolean> first = pool.submit(bookingA);
        Future<Boolean> second = pool.submit(bookingB);
        assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
        start.countDown();
        assertThat(List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS))).containsExactlyInAnyOrder(true, false);
        assertThat(items.bookedQuantityForNight(room.getId(), base)).isEqualTo(1);
        pool.shutdownNow();
    }

    private Callable<Boolean> concurrentBooking(CustomerUser customer, CountDownLatch ready, CountDownLatch start) {
        return () -> {
            ready.countDown(); start.await(5, TimeUnit.SECONDS);
            try { create(customer, room, rate, base, base.plusDays(2), 1); return true; }
            catch (ConflictException conflict) { return false; }
        };
    }

    private ReservationResponse create(CustomerUser customer, Room targetRoom, RoomRate targetRate, LocalDate in, LocalDate out, int quantity) {
        return customerService.create(customer.getId(), request(targetRoom, targetRate, in, out, quantity, 1, 0));
    }
    private CreateReservationRequest request(Room targetRoom, RoomRate targetRate, LocalDate in, LocalDate out, int quantity, int adults, int children) {
        return new CreateReservationRequest(targetRoom.getHotelId(), targetRoom.getId(), targetRate.getId(), in, out, adults, children,
                quantity, "Test", "Guest", "test@example.com", "+94770000000", null, "14:00");
    }
    private CustomerUser customer(String email) {
        CustomerUser c = new CustomerUser(); c.setEmail(email); c.setFirstName("Test"); c.setLastName("Guest");
        c.setPasswordHash("hash"); c.setStatus("ACTIVE"); return customers.save(c);
    }
    private MockHttpSession customerSession(CustomerUser customer) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(com.lankastay.backend.service.CustomerSessionService.CUSTOMER_SESSION_KEY, customer.getId().toString());
        return session;
    }
    private Hotel hotel(String name) {
        Hotel h = new Hotel(); h.setName(name); h.setSlug(name.toLowerCase().replace(' ', '-') + UUID.randomUUID());
        h.setDestinationId(1L); h.setPropertyType("Hotel"); h.setStatus("ACTIVE"); h.setSetupStatus("COMPLETE");
        h.setPublicationStatus("ACTIVE"); h.setPrice(BigDecimal.valueOf(10_000)); return hotels.save(h);
    }
    private Room room(Hotel h, int inventory) {
        Room r = new Room(h.getId(), "Room", "room-" + UUID.randomUUID(), "STANDARD", "Test", 2, 2, 1,
                30.0, "King", inventory, 10_000.0, "ACTIVE", null, "[]"); return rooms.save(r);
    }
    private RoomRate rate(Hotel h, Room r, double weekday, double weekend) {
        RoomRate rr = new RoomRate(h.getId(), r.getId(), "Flexible", "FLEX", weekday, weekend,
                "ROOM_ONLY", "FLEXIBLE_24H", false, 0.0, "ACTIVE"); return rates.save(rr);
    }
}
