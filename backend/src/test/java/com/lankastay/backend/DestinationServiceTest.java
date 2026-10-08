package com.lankastay.backend;

import com.lankastay.backend.dto.destination.*;
import com.lankastay.backend.entity.DestinationStatus;
import com.lankastay.backend.exception.BusinessRuleException;
import com.lankastay.backend.exception.ConflictException;
import com.lankastay.backend.exception.ResourceNotFoundException;
import com.lankastay.backend.service.DestinationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class DestinationServiceTest {

    @Autowired
    private DestinationService destinationService;

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("1. Create Destination draft and verify persistence in database")
    void testCreateDestinationDraft() {
        DestinationCreateRequest req = new DestinationCreateRequest();
        req.setName("Mirissa");
        req.setShortDescription("Famous coastal beach and whale watching destination.");
        req.setFullDescription("Mirissa is a scenic crescent beach town in Southern Sri Lanka famous for surfing and blue whale watching.");
        req.setRegion("Southern Province");
        req.setDistrict("Matara");
        req.setLatitude(5.9483);
        req.setLongitude(80.4716);
        req.setStatus(DestinationStatus.DRAFT);
        req.setThemeKeys(Set.of("COAST", "NATURE"));
        req.setHighlights(List.of("Whale Watching", "Surfing"));

        DestinationResponse response = destinationService.createDestination(req);

        assertNotNull(response.getId());
        assertEquals("Mirissa", response.getName());
        assertEquals("mirissa", response.getSlug());
        assertEquals(DestinationStatus.DRAFT, response.getStatus());
        assertFalse(response.getActive());
        assertEquals("Southern Province", response.getRegion());
        assertEquals("Matara", response.getDistrict());
        assertEquals(5.9483, response.getLatitude());
        assertEquals(80.4716, response.getLongitude());
    }

    @Test
    @DisplayName("A draft can be saved before its location step is complete")
    void testCreateIncompleteDestinationDraft() {
        DestinationCreateRequest req = new DestinationCreateRequest();
        req.setName("Unfinished destination");
        req.setShortDescription("Draft saved before location details are entered.");
        req.setStatus(DestinationStatus.DRAFT);
        req.setLastSavedStep(1);

        DestinationResponse response = destinationService.createDestination(req);
        DestinationResponse reloaded = destinationService.getDestinationById(response.getId());

        assertNotNull(response.getId());
        assertNull(reloaded.getRegion());
        assertNull(reloaded.getDistrict());
        assertNull(reloaded.getLatitude());
        assertNull(reloaded.getLongitude());
        assertEquals(DestinationStatus.DRAFT, reloaded.getStatus());
    }

    @Test
    @DisplayName("Public destination lookup does not expose a draft by numeric ID")
    void testPublicDestinationLookupHidesDraftById() throws Exception {
        DestinationCreateRequest req = new DestinationCreateRequest();
        req.setName("Private numeric destination");
        req.setShortDescription("An unpublished destination.");
        req.setStatus(DestinationStatus.DRAFT);
        DestinationResponse draft = destinationService.createDestination(req);

        mockMvc.perform(get("/api/destinations/{identifier}", draft.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("2. Retrieve Destination by ID and verify data accuracy")
    void testGetDestinationById() {
        DestinationResponse response = destinationService.getDestinationById(1L);
        assertNotNull(response);
        assertEquals("Colombo", response.getName());
        assertEquals("colombo", response.getSlug());
        assertEquals(DestinationStatus.ACTIVE, response.getStatus());
        assertTrue(response.getActive());
    }

    @Test
    @DisplayName("3. Update Destination details and verify persistence")
    void testUpdateDestination() {
        DestinationUpdateRequest update = new DestinationUpdateRequest();
        update.setShortDescription("Updated short description for Colombo.");
        update.setLastSavedStep(3);

        DestinationResponse updated = destinationService.updateDestination(1L, update);

        assertEquals("Updated short description for Colombo.", updated.getShortDescription());
        assertEquals(3, updated.getLastSavedStep());
    }

    @Test
    @DisplayName("4. Save Draft metadata persistence (lastSavedStep, lastCompletedStep)")
    void testSaveDraftMetadata() {
        DestinationCreateRequest req = new DestinationCreateRequest();
        req.setName("Haputale");
        req.setShortDescription("Scenic mountain ridge stays.");
        req.setRegion("Uva Province");
        req.setDistrict("Badulla");
        req.setLatitude(6.7681);
        req.setLongitude(80.9575);
        req.setLastSavedStep(5);
        req.setLastCompletedStep(4);
        req.setLastUpdatedSection("Highlights & Attractions");

        DestinationResponse saved = destinationService.createDestination(req);

        assertEquals(5, saved.getLastSavedStep());
        assertEquals(4, saved.getLastCompletedStep());
        assertEquals("Highlights & Attractions", saved.getLastUpdatedSection());
    }

    @Test
    @DisplayName("5. Lifecycle state machine transitions (DRAFT -> READY_FOR_REVIEW -> ACTIVE <-> INACTIVE)")
    void testLifecycleTransitions() {
        DestinationCreateRequest req = new DestinationCreateRequest();
        req.setName("Tangalle");
        req.setShortDescription("Secluded southern coast beaches.");
        req.setFullDescription("Tangalle is a peaceful resort town on the far south coast.");
        req.setRegion("Southern Province");
        req.setDistrict("Hambantota");
        req.setLatitude(6.0242);
        req.setLongitude(80.7941);
        req.setMainImage("/uploads/destinations/tangalle.jpg");
        req.setThemeKeys(Set.of("COAST"));
        req.setStatus(DestinationStatus.DRAFT);

        DestinationResponse created = destinationService.createDestination(req);
        assertEquals(DestinationStatus.DRAFT, created.getStatus());

        // Submit for review
        DestinationResponse inReview = destinationService.setStatus(created.getId(), DestinationStatus.READY_FOR_REVIEW);
        assertEquals(DestinationStatus.READY_FOR_REVIEW, inReview.getStatus());
        assertFalse(inReview.getActive());

        // Manager approval -> ACTIVE
        DestinationResponse active = destinationService.setStatus(created.getId(), DestinationStatus.ACTIVE);
        assertEquals(DestinationStatus.ACTIVE, active.getStatus());
        assertTrue(active.getActive());

        // Deactivate -> INACTIVE
        DestinationResponse inactive = destinationService.setStatus(created.getId(), DestinationStatus.INACTIVE);
        assertEquals(DestinationStatus.INACTIVE, inactive.getStatus());
        assertFalse(inactive.getActive());

        // Reactivate -> ACTIVE
        DestinationResponse reactivated = destinationService.setStatus(created.getId(), DestinationStatus.ACTIVE);
        assertEquals(DestinationStatus.ACTIVE, reactivated.getStatus());
        assertTrue(reactivated.getActive());
    }

    @Test
    @DisplayName("6. Customer public API hides non-ACTIVE destinations")
    void testCustomerPublicVisibility() {
        DestinationCreateRequest req = new DestinationCreateRequest();
        req.setName("Hidden Bay");
        req.setShortDescription("Unpublished draft bay.");
        req.setRegion("Eastern Province");
        req.setDistrict("Batticaloa");
        req.setLatitude(7.7170);
        req.setLongitude(81.7000);
        req.setStatus(DestinationStatus.DRAFT);

        DestinationResponse created = destinationService.createDestination(req);

        List<DestinationSummaryResponse> activeList = destinationService.getActiveCustomerDestinations();
        boolean containsDraft = activeList.stream().anyMatch(d -> d.getId().equals(created.getId()));
        assertFalse(containsDraft, "Customer public destination query MUST NOT return DRAFT destinations");

        assertThrows(ResourceNotFoundException.class, () -> {
            destinationService.getActiveCustomerDestinationBySlugOrId("hidden-bay");
        }, "Requesting DRAFT destination via customer endpoint MUST throw 404 Not Found");
    }

    @Test
    @DisplayName("7. Duplicate slug or name validation")
    void testDuplicateSlugHandling() {
        DestinationCreateRequest req = new DestinationCreateRequest();
        req.setName("Colombo"); // Existing name
        req.setShortDescription("Duplicate colombo test.");
        req.setRegion("Western Province");
        req.setDistrict("Colombo");
        req.setLatitude(6.9271);
        req.setLongitude(79.8612);

        DestinationResponse created = destinationService.createDestination(req);
        assertNotEquals("colombo", created.getSlug(), "Duplicate slug MUST automatically append suffix e.g. colombo-2");
        assertTrue(created.getSlug().startsWith("colombo-"));
    }

    @Test
    @DisplayName("8. Invalid coordinates validation")
    void testInvalidCoordinatesRejected() {
        DestinationCreateRequest req = new DestinationCreateRequest();
        req.setName("Invalid Lat");
        req.setShortDescription("Testing out of bounds lat.");
        req.setRegion("Western Province");
        req.setDistrict("Colombo");
        req.setLatitude(105.0); // Invalid lat (> 90)
        req.setLongitude(79.8612);

        assertThrows(BusinessRuleException.class, () -> {
            destinationService.createDestination(req);
        });
    }

    @Test
    @DisplayName("9. Optimistic locking conflict handling")
    void testOptimisticLockingConflict() {
        DestinationResponse original = destinationService.getDestinationById(1L);
        assertNotNull(original.getVersion());

        DestinationUpdateRequest update = new DestinationUpdateRequest();
        update.setShortDescription("Stale update attempt");
        update.setVersion(original.getVersion() - 1); // Passing stale version

        assertThrows(ConflictException.class, () -> {
            destinationService.updateDestination(1L, update);
        });
    }

    @Test
    @DisplayName("10. Safe permanent delete case")
    void testSafePermanentDelete() {
        DestinationCreateRequest req = new DestinationCreateRequest();
        req.setName("Temporary Draft");
        req.setShortDescription("Safe to delete.");
        req.setRegion("Southern Province");
        req.setDistrict("Galle");
        req.setLatitude(6.0329);
        req.setLongitude(80.2168);
        req.setStatus(DestinationStatus.DRAFT);

        DestinationResponse created = destinationService.createDestination(req);

        destinationService.deleteDestination(created.getId());

        assertThrows(ResourceNotFoundException.class, () -> {
            destinationService.getDestinationById(created.getId());
        });
    }
}
