package com.lankastay.backend.repository;

import com.lankastay.backend.entity.RoomRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

@Repository
public interface RoomRateRepository extends JpaRepository<RoomRate, Long> {
    List<RoomRate> findByHotelId(Long hotelId);
    List<RoomRate> findByRoomId(Long roomId);
    List<RoomRate> findByRoomIdAndStatus(Long roomId, String status);
    List<RoomRate> findByHotelIdAndRoomIdAndStatus(Long hotelId, Long roomId, String status);

    @Query("select rr from RoomRate rr join Room r on r.id = rr.roomId join Hotel h on h.id = rr.hotelId " +
           "where rr.status = 'ACTIVE' and r.status = 'ACTIVE' and h.status = 'ACTIVE' and h.publicationStatus = 'ACTIVE'")
    List<RoomRate> findCustomerBookableRates();

    boolean existsByHotelIdAndRoomIdAndRatePlanCodeIgnoreCase(Long hotelId, Long roomId, String ratePlanCode);
    boolean existsByHotelIdAndRoomIdAndRatePlanCodeIgnoreCaseAndIdNot(Long hotelId, Long roomId, String ratePlanCode, Long id);
}
