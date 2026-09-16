package com.lankastay.backend.repository;

import com.lankastay.backend.entity.Reservation;
import com.lankastay.backend.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByHotelIdOrderByCreatedAtDesc(Long hotelId);
    List<Reservation> findByHotelId(Long hotelId);
    List<Reservation> findAllByOrderByCreatedAtDesc();
    List<Reservation> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    Optional<Reservation> findByIdAndCustomerId(Long id, UUID customerId);
    Optional<Reservation> findByReservationCode(String reservationCode);
    boolean existsByReservationCode(String reservationCode);
    long countByHotelIdAndReservationStatus(Long hotelId, ReservationStatus status);
    boolean existsByAppliedOfferId(Long appliedOfferId);

    /**
     * A reservation keeps its commercial offer snapshot (title, type, value and
     * calculated discount).  The live offer reference is therefore optional
     * history metadata and must be cleared before the offer is hard-deleted.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Reservation r set r.appliedOfferId = null where r.appliedOfferId = :offerId")
    int detachAppliedOffer(@Param("offerId") Long offerId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Reservation r where r.id = :id")
    Optional<Reservation> findByIdForUpdate(@Param("id") Long id);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Reservation r where r.id = :id and r.customerId = :customerId")
    Optional<Reservation> findByIdAndCustomerIdForUpdate(@Param("id") Long id, @Param("customerId") UUID customerId);
    boolean existsByHotelIdAndAssignedRoomNumberIgnoreCase(Long hotelId, String assignedRoomNumber);
    boolean existsByAssignedPhysicalRoomId(Long assignedPhysicalRoomId);
    @Query("select count(r) from Reservation r where r.hotelId = :hotelId and lower(r.assignedRoomNumber) = lower(:number) " +
           "and r.id <> :excludeId and r.reservationStatus = com.lankastay.backend.entity.ReservationStatus.CONFIRMED " +
           "and r.checkIn < :checkOut and r.checkOut > :checkIn")
    long countOverlappingRoomAssignments(@Param("hotelId") Long hotelId, @Param("number") String number,
                                         @Param("excludeId") Long excludeId, @Param("checkIn") LocalDate checkIn,
                                         @Param("checkOut") LocalDate checkOut);
}
