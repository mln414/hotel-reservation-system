package com.lankastay.backend.service;

import com.lankastay.backend.dto.content.ContentEntryRequest;
import com.lankastay.backend.dto.content.ContentBatchUpdateRequest;
import com.lankastay.backend.entity.ContentEntry;
import com.lankastay.backend.exception.ConflictException;
import com.lankastay.backend.exception.ResourceNotFoundException;
import com.lankastay.backend.repository.ContentEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class ContentEntryService {
    private static final Pattern CONTENT_TYPE_PATTERN = Pattern.compile("[A-Z][A-Z0-9_]{0,63}");
    private static final TypeReference<LinkedHashMap<String, Object>> CONTENT_TYPE = new TypeReference<>() {};
    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final ContentEntryRepository repository;

    public ContentEntryService(ContentEntryRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> list(String rawType, boolean activeOnly) {
        String type = validateType(rawType);
        List<ContentEntry> entries = activeOnly
                ? repository.findByContentTypeAndStatusOrderByDisplayOrderAscIdAsc(type, "ACTIVE")
                : repository.findByContentTypeOrderByDisplayOrderAscIdAsc(type);
        return entries.stream().map(this::toContent).toList();
    }

    @Transactional(readOnly = true)
    public boolean isInitialized(String rawType) {
        return repository.countByContentType(validateType(rawType)) > 0;
    }

    @Transactional
    public Map<String, Object> create(String rawType, ContentEntryRequest request) {
        String type = validateType(rawType);
        String key = validateKey(request.key());
        if (repository.findByContentTypeAndContentKey(type, key).isPresent()) {
            throw new ConflictException("Content already exists.");
        }
        ContentEntry entry = new ContentEntry();
        entry.setContentType(type);
        entry.setContentKey(key);
        apply(entry, request.content());
        return toContent(repository.save(entry));
    }

    @Transactional
    public Map<String, Object> update(String rawType, String rawKey, Map<String, Object> content) {
        String type = validateType(rawType);
        String key = validateKey(rawKey);
        ContentEntry entry = repository.findByContentTypeAndContentKey(type, key)
                .orElseThrow(() -> new ResourceNotFoundException("Content was not found."));
        apply(entry, content);
        return toContent(repository.save(entry));
    }

    @Transactional
    public List<Map<String, Object>> updateMany(String rawType, ContentBatchUpdateRequest request) {
        String type = validateType(rawType);
        List<ContentEntry> entries = new ArrayList<>(request.entries().size());
        for (ContentEntryRequest item : request.entries()) {
            String key = validateKey(item.key());
            ContentEntry entry = repository.findByContentTypeAndContentKey(type, key)
                    .orElseThrow(() -> new ResourceNotFoundException("Content was not found: " + key));
            apply(entry, item.content());
            entries.add(entry);
        }
        return repository.saveAll(entries).stream().map(this::toContent).toList();
    }

    @Transactional
    public List<Map<String, Object>> seedIfEmpty(String rawType, List<ContentEntryRequest> defaults) {
        String type = validateType(rawType);
        if (repository.countByContentType(type) != 0) {
            return list(type, false);
        }
        List<ContentEntry> entries = new ArrayList<>(defaults.size());
        for (ContentEntryRequest request : defaults) {
            ContentEntry entry = new ContentEntry();
            entry.setContentType(type);
            entry.setContentKey(validateKey(request.key()));
            apply(entry, request.content());
            entries.add(entry);
        }
        return repository.saveAll(entries).stream().map(this::toContent).toList();
    }

    @Transactional
    public void delete(String rawType, String rawKey) {
        String type = validateType(rawType);
        String key = validateKey(rawKey);
        if (repository.findByContentTypeAndContentKey(type, key).isEmpty()) {
            throw new ResourceNotFoundException("Content was not found.");
        }
        repository.deleteByContentTypeAndContentKey(type, key);
    }

    private void apply(ContentEntry entry, Map<String, Object> supplied) {
        if (supplied == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content data is required.");
        }
        Map<String, Object> content = new LinkedHashMap<>(supplied);
        content.put("id", entry.getContentKey());
        Object statusValue = content.get("status");
        String status = statusValue == null
                ? (Boolean.FALSE.equals(content.get("active")) ? "INACTIVE" : "ACTIVE")
                : String.valueOf(statusValue).trim().toUpperCase();
        if (!List.of("ACTIVE", "INACTIVE", "DRAFT").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content status must be ACTIVE, INACTIVE, or DRAFT.");
        }
        content.put("status", status);
        content.put("active", "ACTIVE".equals(status));
        Object order = content.get("displayOrder");
        int displayOrder = order instanceof Number number ? number.intValue() : 0;
        entry.setStatus(status);
        entry.setDisplayOrder(displayOrder);
        try {
            entry.setPayloadJson(JSON.writeValueAsString(content));
        } catch (Exception exception) {
            throw new IllegalArgumentException("Content data could not be serialized.", exception);
        }
    }

    private Map<String, Object> toContent(ContentEntry entry) {
        try {
            Map<String, Object> content = JSON.readValue(entry.getPayloadJson(), CONTENT_TYPE);
            content.put("id", entry.getContentKey());
            content.put("status", entry.getStatus());
            content.put("active", "ACTIVE".equals(entry.getStatus()));
            content.put("displayOrder", entry.getDisplayOrder());
            content.put("createdAt", entry.getCreatedAt().toString());
            content.put("updatedAt", entry.getUpdatedAt().toString());
            return content;
        } catch (Exception exception) {
            throw new IllegalStateException("Stored content data could not be read.", exception);
        }
    }

    private String validateType(String type) {
        if (type == null || !CONTENT_TYPE_PATTERN.matcher(type).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content type is invalid.");
        }
        return type;
    }

    private String validateKey(String key) {
        if (key == null || key.isBlank() || key.length() > 160) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Content key is invalid.");
        }
        return key.trim();
    }
}
