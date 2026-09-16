package com.lankastay.backend.service;

import com.lankastay.backend.entity.Amenity;
import com.lankastay.backend.repository.AmenityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AmenityService {

    private final AmenityRepository amenityRepository;

    public AmenityService(AmenityRepository amenityRepository) {
        this.amenityRepository = amenityRepository;
    }

    @Transactional(readOnly = true)
    public List<Amenity> getAllAmenities(String status) {
        if (status == null || status.isBlank()) {
            return amenityRepository.findAll();
        }
        return amenityRepository.findByStatus(status);
    }

    @Transactional(readOnly = true)
    public Optional<Amenity> getAmenityById(Long id) {
        return amenityRepository.findById(id);
    }

    @Transactional
    public Amenity createAmenity(Amenity amenity) {
        amenityRepository.findByName(amenity.getName()).ifPresent(existing -> {
            throw new IllegalArgumentException("Amenity already exists with name: " + amenity.getName());
        });
        if (amenity.getStatus() == null) {
            amenity.setStatus("ACTIVE");
        }
        return amenityRepository.save(amenity);
    }

    @Transactional
    public Amenity updateAmenity(Long id, Amenity updated) {
        Amenity amenity = amenityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Amenity not found with ID: " + id));

        amenity.setName(updated.getName());
        amenity.setCategory(updated.getCategory());
        amenity.setIcon(updated.getIcon());
        amenity.setStatus(updated.getStatus());

        return amenityRepository.save(amenity);
    }

    @Transactional
    public void deleteAmenity(Long id) {
        amenityRepository.deleteById(id);
    }
}
