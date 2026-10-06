package com.lankastay.backend.controller;

import com.lankastay.backend.dto.content.ContentEntryRequest;
import com.lankastay.backend.dto.content.ContentBatchUpdateRequest;
import com.lankastay.backend.dto.content.ContentSeedRequest;
import com.lankastay.backend.service.ContentEntryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class ContentEntryController {
    private final ContentEntryService contentService;

    public ContentEntryController(ContentEntryService contentService) {
        this.contentService = contentService;
    }

    @GetMapping("/api/public/content/{type}")
    public List<Map<String, Object>> listPublic(@PathVariable String type) {
        return contentService.list(type, true);
    }

    @GetMapping("/api/public/content/{type}/initialized")
    public boolean isPublicContentInitialized(@PathVariable String type) {
        return contentService.isInitialized(type);
    }

    @GetMapping("/api/v1/management/content/{type}")
    @PreAuthorize("hasRole('MANAGER')")
    public List<Map<String, Object>> listManagement(@PathVariable String type) {
        return contentService.list(type, false);
    }

    @PutMapping("/api/v1/management/content/{type}")
    @PreAuthorize("hasRole('MANAGER')")
    public List<Map<String, Object>> updateMany(
            @PathVariable String type,
            @Valid @RequestBody ContentBatchUpdateRequest request
    ) {
        return contentService.updateMany(type, request);
    }

    @PostMapping("/api/v1/management/content/{type}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('MANAGER')")
    public Map<String, Object> create(
            @PathVariable String type,
            @Valid @RequestBody ContentEntryRequest request
    ) {
        return contentService.create(type, request);
    }

    @PutMapping("/api/v1/management/content/{type}/{key}")
    @PreAuthorize("hasRole('MANAGER')")
    public Map<String, Object> update(
            @PathVariable String type,
            @PathVariable String key,
            @RequestBody Map<String, Object> content
    ) {
        return contentService.update(type, key, content);
    }

    @PostMapping("/api/v1/management/content/{type}/seed")
    @PreAuthorize("hasRole('MANAGER')")
    public List<Map<String, Object>> seed(
            @PathVariable String type,
            @Valid @RequestBody ContentSeedRequest request
    ) {
        return contentService.seedIfEmpty(type, request.entries());
    }

    @DeleteMapping("/api/v1/management/content/{type}/{key}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('MANAGER')")
    public void delete(@PathVariable String type, @PathVariable String key) {
        contentService.delete(type, key);
    }
}
