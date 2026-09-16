package com.lankastay.backend.repository;

import com.lankastay.backend.entity.Amenity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AmenityRepository extends JpaRepository<Amenity, Long> {
    List<Amenity> findByStatus(String status);
    Optional<Amenity> findByName(String name);
}
