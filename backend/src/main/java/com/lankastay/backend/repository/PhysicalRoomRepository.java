package com.lankastay.backend.repository;

import com.lankastay.backend.entity.PhysicalRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface PhysicalRoomRepository extends JpaRepository<PhysicalRoom, Long> {
    List<PhysicalRoom> findByHotelIdOrderByRoomNumberAsc(Long hotelId);
    List<PhysicalRoom> findByRoomTypeIdOrderByRoomNumberAsc(Long roomTypeId);
    Optional<PhysicalRoom> findByHotelIdAndRoomNumberKey(Long hotelId, String roomNumberKey);
    boolean existsByRoomTypeId(Long roomTypeId);
    long countByRoomTypeId(Long roomTypeId);
    long countByRoomTypeIdAndBaseOperationalStatusNot(Long roomTypeId, String status);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PhysicalRoom p where p.id = :id")
    Optional<PhysicalRoom> findByIdForUpdate(@Param("id") Long id);
}
