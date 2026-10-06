package com.lankastay.backend.repository;

import com.lankastay.backend.entity.ContentEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContentEntryRepository extends JpaRepository<ContentEntry, Long> {
    List<ContentEntry> findByContentTypeOrderByDisplayOrderAscIdAsc(String contentType);
    List<ContentEntry> findByContentTypeAndStatusOrderByDisplayOrderAscIdAsc(String contentType, String status);
    Optional<ContentEntry> findByContentTypeAndContentKey(String contentType, String contentKey);
    long countByContentType(String contentType);
    void deleteByContentTypeAndContentKey(String contentType, String contentKey);
}
