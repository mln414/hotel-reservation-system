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

    /** Batch-load reviews for a set of reservation IDs in one query. */
    @Query("SELECT r FROM Review r WHERE r.reservation.id IN :reservationIds")
    List<Review> findByReservationIdIn(@Param("reservationIds") List<Long> reservationIds);

    /**
     * Filtered query used by management list and public list endpoints.
     * All parameters are optional — pass {@code null} to skip that filter.
     * Search matches guest name, review title, or comment (case-insensitive).
     */
    @Query("""
            SELECT r FROM Review r
            LEFT JOIN r.reservation res
            WHERE (:hotelId IS NULL OR r.hotel.id = :hotelId)
              AND (:status IS NULL OR r.status = :status)
              AND (:rating IS NULL OR r.overallRating = :rating)
              AND (:search IS NULL
                   OR LOWER(r.title) LIKE CONCAT('%', :search, '%')
                   OR LOWER(r.comment) LIKE CONCAT('%', :search, '%')
                   OR (res IS NOT NULL AND LOWER(res.guestName) LIKE CONCAT('%', :search, '%')))
            ORDER BY r.createdAt DESC
            """)
    List<Review> findByFilters(
            @Param("hotelId") Long hotelId,
            @Param("status") ReviewStatus status,
            @Param("rating") Integer rating,
            @Param("search") String search);

    @Query("SELECT AVG(r.overallRating) FROM Review r WHERE r.hotel.id = :hotelId AND r.status = :status")
    Double findAverageRatingByHotelIdAndStatus(@Param("hotelId") Long hotelId, @Param("status") ReviewStatus status);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.hotel.id = :hotelId AND r.status = :status")
    long countByHotelIdAndStatus(@Param("hotelId") Long hotelId, @Param("status") ReviewStatus status);

    @Query("SELECT r.overallRating, COUNT(r) FROM Review r WHERE r.hotel.id = :hotelId AND r.status = :status GROUP BY r.overallRating")
    List<Object[]> findRatingDistributionByHotelIdAndStatus(@Param("hotelId") Long hotelId, @Param("status") ReviewStatus status);

    @Query("SELECT AVG(r.cleanlinessRating), AVG(r.comfortRating), AVG(r.staffServiceRating), AVG(r.facilitiesRating), AVG(r.locationRating), AVG(r.valueForMoneyRating) FROM Review r WHERE r.hotel.id = :hotelId AND r.status = :status")
    List<Object[]> findCategoryAveragesByHotelIdAndStatus(@Param("hotelId") Long hotelId, @Param("status") ReviewStatus status);
}
