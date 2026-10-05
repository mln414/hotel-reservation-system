package com.lankastay.backend.repository;

import com.lankastay.backend.entity.PhysicalRoomBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface PhysicalRoomBlockRepository extends JpaRepository<PhysicalRoomBlock, Long> {
    List<PhysicalRoomBlock> findByPhysicalRoomId(Long roomId);
    boolean existsByPhysicalRoomId(Long roomId);
    @Query("select count(distinct b.physicalRoomId) from PhysicalRoomBlock b join PhysicalRoom p on p.id = b.physicalRoomId " +
           "where p.roomTypeId = :typeId and p.baseOperationalStatus = 'AVAILABLE' and b.fromDate <= :night and b.throughDate >= :night")
    long countBlockedForNight(@Param("typeId") Long typeId, @Param("night") LocalDate night);
    @Query("select count(b) from PhysicalRoomBlock b where b.physicalRoomId = :roomId " +
           "and b.fromDate < :checkOut and b.throughDate >= :checkIn")
    long countOverlapping(@Param("roomId") Long roomId, @Param("checkIn") LocalDate checkIn, @Param("checkOut") LocalDate checkOut);
}
