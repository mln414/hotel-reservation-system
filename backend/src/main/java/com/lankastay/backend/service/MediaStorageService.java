package com.lankastay.backend.service;

import com.lankastay.backend.dto.media.MediaUploadResponse;
import com.lankastay.backend.exception.BusinessRuleException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class MediaStorageService {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );
    private static final Set<String> ALLOWED_VIDEO_TYPES = Set.of(
            "video/mp4",
            "video/webm",
            "video/ogg"
    );

    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    private static final long MAX_VIDEO_SIZE = 50 * 1024 * 1024;

    private final Path uploadLocation;

    public MediaStorageService(@Value("${file.upload-dir:uploads}") String uploadDir) {
        this.uploadLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory: " + uploadDir, e);
        }
    }

    public MediaUploadResponse storeFile(MultipartFile file, String requestedFolder) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("Please upload a valid, non-empty image file.");
        }

        String contentType = file.getContentType();
        String normalizedType = contentType == null ? "" : contentType.toLowerCase();
        boolean video = ALLOWED_VIDEO_TYPES.contains(normalizedType);
        if (!ALLOWED_IMAGE_TYPES.contains(normalizedType) && !video) {
            throw new BusinessRuleException("Unsupported file format. Only JPG, PNG, WebP, MP4, WebM, and OGG files are allowed.");
        }
        long maxSize = video ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
        if (file.getSize() > maxSize) {
            throw new BusinessRuleException(video ? "Video size exceeds maximum limit of 50 MB." : "Image size exceeds maximum limit of 5 MB.");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.png");

        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new BusinessRuleException("Invalid filename path traversal attempt detected.");
        }

        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex).toLowerCase();
        } else {
            if ("image/jpeg".equals(contentType)) extension = ".jpg";
            else if ("image/png".equals(contentType)) extension = ".png";
            else if ("image/webp".equals(contentType)) extension = ".webp";
        }

        String folder = sanitizeFolder(requestedFolder, video ? "videos" : "images");
        String filenamePrefix = "destinations".equals(folder) ? "dest" : folder;
        String generatedFilename = filenamePrefix + "_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;

        try {
            Path folderLocation = this.uploadLocation.resolve(folder);
            Files.createDirectories(folderLocation);
            Path targetLocation = folderLocation.resolve(generatedFilename);
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }

            String publicUrl = "/uploads/" + folder + "/" + generatedFilename;
            return new MediaUploadResponse(publicUrl, generatedFilename, file.getSize(), normalizedType);
        } catch (IOException ex) {
            throw new BusinessRuleException("Failed to store uploaded file on server: " + ex.getMessage());
        }
    }

    /**
     * Keeps the original service contract for callers that upload destination media.
     */
    public MediaUploadResponse storeFile(MultipartFile file) {
        return storeFile(file, "destinations");
    }

    private String sanitizeFolder(String requestedFolder, String fallback) {
        if (requestedFolder == null || requestedFolder.isBlank()) return fallback;
        String folder = requestedFolder.trim().toLowerCase();
        if (!folder.matches("[a-z0-9-]{1,40}")) {
            throw new BusinessRuleException("Invalid media storage folder.");
        }
        return folder;
    }
}
