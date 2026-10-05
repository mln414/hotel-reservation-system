package com.lankastay.backend.service;

import com.lankastay.backend.dto.media.MediaUploadResponse;
import com.lankastay.backend.exception.BusinessRuleException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import javax.imageio.*;
import javax.imageio.stream.ImageInputStream;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.util.*;

@Service
public class MediaStorageService {
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final int MAX_DIMENSION = 8192;
    private static final long MAX_PIXELS = 20_000_000;
    private final Path uploadLocation;

    public MediaStorageService(@Value("${file.upload-dir:uploads}") String uploadDir) {
        uploadLocation = Paths.get(uploadDir).toAbsolutePath().normalize().resolve("destinations");
        try { Files.createDirectories(uploadLocation); }
        catch (IOException e) { throw new IllegalStateException("Could not initialize image storage", e); }
    }

    public MediaUploadResponse storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) throw invalid("Please upload a non-empty image.");
        if (file.getSize() > MAX_FILE_SIZE) throw invalid("File size exceeds maximum limit of 5 MB.");
        String name = file.getOriginalFilename();
        // Reject traversal and multiple extensions BEFORE path normalization.
        if (name == null || !name.matches("[^./\\\\\u0000-\u001f]+\\.(?i:jpg|jpeg|png|webp)"))
            throw invalid("Invalid image filename. Only single-extension JPG, PNG, and WebP names are allowed.");
        try (InputStream input = file.getInputStream()) {
            byte[] bytes = input.readNBytes((int) MAX_FILE_SIZE + 1);
            if (bytes.length > MAX_FILE_SIZE) throw invalid("File size exceeds maximum limit of 5 MB.");
            try (ImageInputStream stream = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
                Iterator<ImageReader> readers = ImageIO.getImageReaders(stream);
                if (!readers.hasNext()) throw invalid("Image cannot be decoded.");
                ImageReader reader = readers.next();
                try {
                    String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                    if (!Set.of("jpeg", "jpg", "png", "webp").contains(format)) throw invalid("Unsupported image format.");
                    String extension = name.substring(name.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
                    if (!(format.equals(extension) || Set.of("jpg", "jpeg").contains(format) && Set.of("jpg", "jpeg").contains(extension)))
                        throw invalid("Image extension does not match verified content.");
                    reader.setInput(stream, true, true);
                    int width = reader.getWidth(0), height = reader.getHeight(0);
                    if (width < 1 || height < 1 || width > MAX_DIMENSION || height > MAX_DIMENSION || (long) width * height > MAX_PIXELS)
                        throw invalid("Image dimensions exceed safe limits.");
                    BufferedImage image = reader.read(0);
                    if (image == null) throw invalid("Image cannot be decoded.");
                    // Re-encode pixels to discard metadata, trailing scripts, and polyglot payloads.
                    // WebP is decoded by the trusted plugin and stored as a sanitized PNG.
                    String storedFormat = Set.of("jpeg", "jpg").contains(format) ? "jpg" : "png";
                    String generated = "dest_" + UUID.randomUUID() + "." + storedFormat;
                    ByteArrayOutputStream output = new ByteArrayOutputStream();
                    if (!ImageIO.write(image, storedFormat, output)) throw invalid("Image cannot be safely encoded.");
                    if (output.size() > MAX_FILE_SIZE) throw invalid("Sanitized image exceeds maximum limit of 5 MB.");
                    Path target = uploadLocation.resolve(generated).normalize();
                    if (!target.getParent().equals(uploadLocation)) throw invalid("Invalid storage path.");
                    Files.write(target, output.toByteArray(), StandardOpenOption.CREATE_NEW);
                    return new MediaUploadResponse("/uploads/destinations/" + generated, generated, (long) output.size(),
                            storedFormat.equals("jpg") ? "image/jpeg" : "image/png");
                } finally { reader.dispose(); }
            }
        } catch (IOException | IllegalArgumentException e) {
            throw invalid("Image cannot be decoded or stored safely.");
        }
    }
    private BusinessRuleException invalid(String message) { return new BusinessRuleException(message); }
}
