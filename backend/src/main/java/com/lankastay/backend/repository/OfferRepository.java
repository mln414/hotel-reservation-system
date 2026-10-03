package com.lankastay.backend.repository;

import com.lankastay.backend.entity.Offer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface OfferRepository extends JpaRepository<Offer, Long> {
    Optional<Offer> findBySlug(String slug);
    boolean existsBySlug(String slug);

    List<Offer> findByStatusOrderByDisplayOrderAscCreatedAtDesc(String status);

    @Query("SELECT DISTINCT o FROM Offer o LEFT JOIN o.targetHotelIds h WHERE o.status = :status AND (:hotelId IS NULL OR h = :hotelId OR h IS NULL)")
    List<Offer> findActiveOffersByHotel(@Param("status") String status, @Param("hotelId") Long hotelId);

    @Query("SELECT DISTINCT o FROM Offer o LEFT JOIN o.targetHotelIds h WHERE :hotelId IS NULL OR h = :hotelId")
    List<Offer> findByHotelId(@Param("hotelId") Long hotelId);

    @Query("select count(o) from Offer o join o.targetRoomTypeIds r where r = :roomId")
    long countTargetingRoomType(@Param("roomId") Long roomId);
}
