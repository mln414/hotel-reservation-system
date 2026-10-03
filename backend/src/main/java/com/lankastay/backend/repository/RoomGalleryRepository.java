package com.lankastay.backend.repository;

import com.lankastay.backend.entity.RoomGalleryImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomGalleryRepository extends JpaRepository<RoomGalleryImage, Long> {
    List<RoomGalleryImage> findByRoomIdOrderByDisplayOrderAscIdAsc(Long roomId);
    void deleteByRoomId(Long roomId);
    Optional<RoomGalleryImage> findFirstByRoomIdAndIsCoverTrue(Long roomId);
}
