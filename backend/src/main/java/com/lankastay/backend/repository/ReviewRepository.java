package com.lankastay.backend.repository;

import com.lankastay.backend.entity.Review;
import com.lankastay.backend.entity.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByReservationId(Long reservationId);

    boolean existsByHotelId(Long hotelId);

    Optional<Review> findByReservationId(Long reservationId);

    List<Review> findByHotelIdAndStatusOrderByCreatedAtDesc(Long hotelId, ReviewStatus status);

    List<Review> findByHotelIdOrderByCreatedAtDesc(Long hotelId);

    List<Review> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);

    List<Review> findAllByOrderByCreatedAtDesc();

    @Query("SELECT AVG(r.overallRating) FROM Review r WHERE r.hotel.id = :hotelId AND r.status = :status")
    Double findAverageRatingByHotelIdAndStatus(@Param("hotelId") Long hotelId, @Param("status") ReviewStatus status);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.hotel.id = :hotelId AND r.status = :status")
    long countByHotelIdAndStatus(@Param("hotelId") Long hotelId, @Param("status") ReviewStatus status);

    @Query("SELECT r.overallRating, COUNT(r) FROM Review r WHERE r.hotel.id = :hotelId AND r.status = :status GROUP BY r.overallRating")
    List<Object[]> findRatingDistributionByHotelIdAndStatus(@Param("hotelId") Long hotelId, @Param("status") ReviewStatus status);

    @Query("SELECT AVG(r.cleanlinessRating), AVG(r.comfortRating), AVG(r.staffServiceRating), AVG(r.facilitiesRating), AVG(r.locationRating), AVG(r.valueForMoneyRating) FROM Review r WHERE r.hotel.id = :hotelId AND r.status = :status")
    List<Object[]> findCategoryAveragesByHotelIdAndStatus(@Param("hotelId") Long hotelId, @Param("status") ReviewStatus status);
}
