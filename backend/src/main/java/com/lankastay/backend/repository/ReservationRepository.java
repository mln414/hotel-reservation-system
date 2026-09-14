package com.lankastay.backend.repository;

import com.lankastay.backend.entity.Reservation;
import com.lankastay.backend.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
}
