package com.lankastay.backend.repository;

import com.lankastay.backend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByHotelId(Long hotelId);
    List<Room> findByHotelIdAndStatus(Long hotelId, String status);
    long countByHotelId(Long hotelId);
    long countByHotelIdAndStatus(Long hotelId, String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Room r where r.id = :id")
    Optional<Room> findByIdForUpdate(@Param("id") Long id);

    @Query("select r from Room r join Hotel h on h.id = r.hotelId where r.status = 'ACTIVE' and h.status = 'ACTIVE' and h.publicationStatus = 'ACTIVE'")
    List<Room> findCustomerBookableRooms();

    boolean existsByHotelIdAndSlug(Long hotelId, String slug);
    boolean existsByHotelIdAndSlugAndIdNot(Long hotelId, String slug, Long id);
    boolean existsByHotelIdAndNameIgnoreCase(Long hotelId, String name);
    boolean existsByHotelIdAndNameIgnoreCaseAndIdNot(Long hotelId, String name, Long id);

    @Query("select coalesce(sum(r.inventoryCount), 0) from Room r where r.hotelId in :hotelIds and r.status = :status")
    Long sumInventoryCountByHotelIdsAndStatus(@Param("hotelIds") List<Long> hotelIds, @Param("status") String status);
}
