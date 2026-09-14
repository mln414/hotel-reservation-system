package com.lankastay.backend.repository;

import com.lankastay.backend.entity.Reservation;
import com.lankastay.backend.entity.ReservationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReservationItemRepository extends JpaRepository<ReservationItem, Long> {
    List<ReservationItem> findByReservationId(Long reservationId);
    void deleteByReservationId(Long reservationId);
    List<ReservationItem> findByReservationIdIn(List<Long> reservationIds);
    boolean existsByRoomId(Long roomId);
    boolean existsByRoomRateId(Long roomRateId);

    @Query("select coalesce(sum(i.quantity), 0) from ReservationItem i join Reservation r on r.id = i.reservationId " +
           "where i.roomId = :roomId and r.reservationStatus = com.lankastay.backend.entity.ReservationStatus.CONFIRMED " +
           "and r.checkIn <= :night and r.checkOut > :night")
    long bookedQuantityForNight(@Param("roomId") Long roomId, @Param("night") LocalDate night);

    @Query("select r from Reservation r join ReservationItem i on r.id = i.reservationId " +
           "where i.roomId = :roomId and r.reservationStatus = com.lankastay.backend.entity.ReservationStatus.CONFIRMED " +
           "and r.checkOut > :fromDate")
    List<Reservation> findActiveFutureReservationsForRoom(@Param("roomId") Long roomId, @Param("fromDate") LocalDate fromDate);

    @Query("select coalesce(sum(i.quantity), 0) from ReservationItem i join Reservation r on r.id = i.reservationId " +
           "where r.hotelId in :hotelIds and r.reservationStatus = com.lankastay.backend.entity.ReservationStatus.CONFIRMED " +
           "and r.checkIn <= :night and r.checkOut > :night")
    long bookedQuantityForNightForHotels(@Param("hotelIds") List<Long> hotelIds, @Param("night") LocalDate night);
}
