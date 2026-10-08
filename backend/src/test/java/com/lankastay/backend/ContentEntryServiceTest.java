package com.lankastay.backend;

import com.lankastay.backend.dto.content.ContentEntryRequest;
import com.lankastay.backend.service.ContentEntryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class ContentEntryServiceTest {
    @Autowired
    private ContentEntryService contentService;

    @Test
    void savesContentAndReturnsOnlyActiveEntriesPublicly() {
        Map<String, Object> saved = contentService.create(
                "ROOM_AMENITY",
                new ContentEntryRequest("wifi", Map.of("name", "Free Wi-Fi", "active", true, "displayOrder", 0))
        );

        assertEquals("wifi", saved.get("id"));
        assertEquals(1, contentService.list("ROOM_AMENITY", true).size());

        Map<String, Object> updated = contentService.update(
                "ROOM_AMENITY",
                "wifi",
                Map.of("name", "Free Wi-Fi", "status", "INACTIVE", "displayOrder", 0)
        );

        assertEquals("INACTIVE", updated.get("status"));
        assertTrue(contentService.list("ROOM_AMENITY", true).isEmpty());
        assertEquals("INACTIVE", contentService.list("ROOM_AMENITY", false).get(0).get("status"));
    }

    @Test
    void seedsDefaultContentOnlyWhenTheTypeIsEmpty() {
        List<ContentEntryRequest> defaults = List.of(
                new ContentEntryRequest("wifi", Map.of("name", "Free Wi-Fi", "status", "ACTIVE")),
                new ContentEntryRequest("pool", Map.of("name", "Swimming Pool", "status", "ACTIVE"))
        );

        assertEquals(2, contentService.seedIfEmpty("HOTEL_FACILITY", defaults).size());
        assertEquals(2, contentService.seedIfEmpty("HOTEL_FACILITY", defaults).size());
    }
}
