package com.lankastay.backend.repository;

import com.lankastay.backend.entity.ReservationPhysicalRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface ReservationPhysicalRoomRepository extends JpaRepository<ReservationPhysicalRoom, Long> {
    List<ReservationPhysicalRoom> findByReservationIdOrderByIdAsc(Long reservationId);
    boolean existsByPhysicalRoomId(Long physicalRoomId);
    @Query("select count(a) from ReservationPhysicalRoom a join Reservation r on r.id = a.reservationId " +
           "where a.physicalRoomId = :physicalRoomId and r.reservationStatus = com.lankastay.backend.entity.ReservationStatus.CONFIRMED " +
           "and r.checkOut > :today")
    long countActiveFutureAssignments(@Param("physicalRoomId") Long physicalRoomId, @Param("today") LocalDate today);
    long countByReservationId(Long reservationId);
    void deleteByReservationId(Long reservationId);
    @Query("select count(a) from ReservationPhysicalRoom a join Reservation r on r.id = a.reservationId " +
           "where a.physicalRoomId = :physicalRoomId and r.id <> :excludeId " +
           "and r.reservationStatus = com.lankastay.backend.entity.ReservationStatus.CONFIRMED " +
           "and r.checkIn < :checkOut and r.checkOut > :checkIn")
    long countOverlapping(@Param("physicalRoomId") Long physicalRoomId, @Param("excludeId") Long excludeId,
                          @Param("checkIn") LocalDate checkIn, @Param("checkOut") LocalDate checkOut);
    @Query("select count(a) from ReservationPhysicalRoom a join Reservation r on r.id = a.reservationId " +
           "where a.physicalRoomId = :physicalRoomId and r.reservationStatus = com.lankastay.backend.entity.ReservationStatus.CONFIRMED " +
           "and r.checkIn < :checkOut and r.checkOut > :checkIn")
    long countRoomReservationsOverlapping(@Param("physicalRoomId") Long physicalRoomId,
                                          @Param("checkIn") LocalDate checkIn, @Param("checkOut") LocalDate checkOut);
}
