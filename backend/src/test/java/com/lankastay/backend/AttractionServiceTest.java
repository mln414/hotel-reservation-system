package com.lankastay.backend;

import com.lankastay.backend.dto.attraction.AttractionCreateRequest;
import com.lankastay.backend.dto.attraction.AttractionResponse;
import com.lankastay.backend.dto.attraction.AttractionUpdateRequest;
import com.lankastay.backend.entity.Attraction;
import com.lankastay.backend.entity.AttractionStatus;
import com.lankastay.backend.entity.Destination;
import com.lankastay.backend.entity.DestinationStatus;
import com.lankastay.backend.exception.ResourceNotFoundException;
import com.lankastay.backend.repository.AttractionRepository;
import com.lankastay.backend.repository.DestinationRepository;
import com.lankastay.backend.service.AttractionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class AttractionServiceTest {

    @Autowired
    private AttractionService attractionService;

    @Autowired
    private AttractionRepository attractionRepository;

    @Autowired
    private DestinationRepository destinationRepository;

    private Long colomboDestinationId;
    private Long galleDestinationId;

    @BeforeEach
    void setUp() {
        colomboDestinationId = destinationRepository.saveAndFlush(
                createDestination("Test Colombo", "test-colombo")).getId();
        Destination galle = destinationRepository.saveAndFlush(
                createDestination("Test Galle", "test-galle"));
        galleDestinationId = galle.getId();

        String[] attractionNames = {
                "Galle Fort",
                "Galle Lighthouse",
                "Unawatuna Beach",
                "Japanese Peace Pagoda"
        };
        for (int i = 0; i < attractionNames.length; i++) {
            Attraction attraction = new Attraction();
            attraction.setDestination(galle);
            attraction.setName(attractionNames[i]);
            attraction.setType("LANDMARK");
            attraction.setStatus(AttractionStatus.ACTIVE);
            attraction.setDisplayOrder(i);
            attractionRepository.save(attraction);
        }
        attractionRepository.flush();
    }

    private Destination createDestination(String name, String slug) {
        Destination destination = new Destination();
        destination.setName(name);
        destination.setSlug(slug);
        destination.setShortDescription("Test destination");
        destination.setFullDescription("Destination fixture for attraction service tests.");
        destination.setCategory("Test");
        destination.setRegion("Southern Province");
        destination.setDistrict("Test District");
        destination.setLatitude(6.0);
        destination.setLongitude(80.0);
        destination.setStatus(DestinationStatus.ACTIVE);
        destination.setMainImage("/assets/test.png");
        return destination;
    }

    @Test
    @DisplayName("1. Create Attraction and verify relationship to Destination")
    void testCreateAttraction() {
        AttractionCreateRequest req = new AttractionCreateRequest();
        req.setName("Red Mosque");
        req.setType("HERITAGE");
        req.setShortDescription("Historic Jami Ul-Alfar Mosque in Pettah.");
        req.setLatitude(6.9387);
        req.setLongitude(79.8517);
        req.setStatus(AttractionStatus.ACTIVE);

        AttractionResponse created = attractionService.createAttraction(colomboDestinationId, req);

        assertNotNull(created.getId());
        assertEquals(colomboDestinationId, created.getDestinationId());
        assertEquals("Red Mosque", created.getName());
        assertEquals("HERITAGE", created.getType());
        assertEquals(6.9387, created.getLatitude());
        assertEquals(79.8517, created.getLongitude());
    }

    @Test
    @DisplayName("2. Retrieve attractions for Destination")
    void testGetAttractionsForDestination() {
        List<AttractionResponse> galleAttractions = attractionService.getAttractionsByDestinationId(galleDestinationId);
        assertNotNull(galleAttractions);
        assertTrue(galleAttractions.size() >= 4, "Galle attraction fixtures must be returned");

        assertEquals("Galle Fort", galleAttractions.get(0).getName());
        assertEquals("Galle Lighthouse", galleAttractions.get(1).getName());
        assertEquals("Unawatuna Beach", galleAttractions.get(2).getName());
        assertEquals("Japanese Peace Pagoda", galleAttractions.get(3).getName());
    }

    @Test
    @DisplayName("3. Update Attraction details")
    void testUpdateAttraction() {
        List<AttractionResponse> galleAttractions = attractionService.getAttractionsByDestinationId(galleDestinationId);
        AttractionResponse first = galleAttractions.get(0);

        AttractionUpdateRequest update = new AttractionUpdateRequest();
        update.setShortDescription("Updated description for UNESCO Galle Fort.");

        AttractionResponse updated = attractionService.updateAttraction(galleDestinationId, first.getId(), update);
        assertEquals("Updated description for UNESCO Galle Fort.", updated.getShortDescription());
    }

    @Test
    @DisplayName("4. Delete Attraction and verify displayOrder re-indexing")
    void testDeleteAttraction() {
        List<AttractionResponse> listBefore = attractionService.getAttractionsByDestinationId(galleDestinationId);
        int initialSize = listBefore.size();
        AttractionResponse target = listBefore.get(1); // Second item (Galle Lighthouse)

        attractionService.deleteAttraction(galleDestinationId, target.getId());

        List<AttractionResponse> listAfter = attractionService.getAttractionsByDestinationId(galleDestinationId);
        assertEquals(initialSize - 1, listAfter.size());

        // Verify display orders are 0, 1, 2...
        for (int i = 0; i < listAfter.size(); i++) {
            assertEquals(i, listAfter.get(i).getDisplayOrder(), "Display order must be re-indexed cleanly to 0, 1, 2...");
        }

        assertThrows(ResourceNotFoundException.class, () -> {
            attractionService.getAttractionById(galleDestinationId, target.getId());
        });
    }
}
