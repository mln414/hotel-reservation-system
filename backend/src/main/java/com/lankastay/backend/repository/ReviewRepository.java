// SE2030 LankaStay - Customer Review Management and Moderation
package com.lankastay.backend.repository;

import com.lankastay.backend.entity.Review;
import com.lankastay.backend.entity.ReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByHotelIdAndStatusOrderByCreatedAtDesc(Long hotelId, ReviewStatus status);

    long countByHotelIdAndStatus(Long hotelId, ReviewStatus status);

    long countByStatus(ReviewStatus status);
    boolean existsByReservationId(Long reservationId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.hotelId = :hotelId AND r.status = :status")
    Double calculateAverageRating(@Param("hotelId") Long hotelId, @Param("status") ReviewStatus status);

    @Query("SELECT AVG(r.cleanlinessRating) FROM Review r WHERE r.hotelId = :hotelId AND r.status = :status AND r.cleanlinessRating IS NOT NULL")
    Double calculateAverageCleanliness(@Param("hotelId") Long hotelId, @Param("status") ReviewStatus status);

    @Query("SELECT AVG(r.staffRating) FROM Review r WHERE r.hotelId = :hotelId AND r.status = :status AND r.staffRating IS NOT NULL")
    Double calculateAverageStaff(@Param("hotelId") Long hotelId, @Param("status") ReviewStatus status);

    @Query("SELECT AVG(r.facilitiesRating) FROM Review r WHERE r.hotelId = :hotelId AND r.status = :status AND r.facilitiesRating IS NOT NULL")
    Double calculateAverageFacilities(@Param("hotelId") Long hotelId, @Param("status") ReviewStatus status);

    @Query("SELECT AVG(r.locationRating) FROM Review r WHERE r.hotelId = :hotelId AND r.status = :status AND r.locationRating IS NOT NULL")
    Double calculateAverageLocation(@Param("hotelId") Long hotelId, @Param("status") ReviewStatus status);

    @Query("SELECT AVG(r.valueRating) FROM Review r WHERE r.hotelId = :hotelId AND r.status = :status AND r.valueRating IS NOT NULL")
    Double calculateAverageValue(@Param("hotelId") Long hotelId, @Param("status") ReviewStatus status);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.hotelId = :hotelId AND r.status = :status AND FLOOR(r.rating) = :star")
    long countByStarRating(@Param("hotelId") Long hotelId, @Param("status") ReviewStatus status, @Param("star") int star);

    @Query("SELECT r FROM Review r WHERE " +
           "(:hotelId IS NULL OR r.hotelId = :hotelId) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:minRating IS NULL OR r.rating >= :minRating) AND " +
           "(:search IS NULL OR LOWER(r.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(r.comment) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(r.guestName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY r.createdAt DESC")
    List<Review> filterManagementReviews(
            @Param("hotelId") Long hotelId,
            @Param("status") ReviewStatus status,
            @Param("minRating") Double minRating,
            @Param("search") String search
    );
}
