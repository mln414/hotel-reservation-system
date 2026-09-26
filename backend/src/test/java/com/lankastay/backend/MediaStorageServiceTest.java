package com.lankastay.backend;

import com.lankastay.backend.service.MediaStorageService;
import com.lankastay.backend.exception.BusinessRuleException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import static org.junit.jupiter.api.Assertions.*;

class MediaStorageServiceTest {
    @TempDir Path directory;
    MediaStorageService storage;
    @BeforeEach void setup() { storage = new MediaStorageService(directory.toString()); }

    private byte[] image(String format) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), format, out);
        return out.toByteArray();
    }
    @ParameterizedTest @ValueSource(strings={"png", "jpg", "jpeg"})
    void acceptsVerifiedRasterAndIgnoresClientMime(String extension) throws Exception {
        byte[] data = image(extension.equals("jpeg") ? "jpg" : extension);
        var result = storage.storeFile(new MockMultipartFile("file", "cover." + extension, "text/html", data));
        assertTrue(result.getFilename().startsWith("dest_"));
        assertFalse(result.getFilename().contains("cover"));
        assertNotNull(ImageIO.read(directory.resolve("destinations").resolve(result.getFilename()).toFile()));
    }
    @ParameterizedTest @ValueSource(strings={"payload.html", "payload.svg", "payload.jsp", "payload.php",
            "payload.js", "payload.exe.png", "../cover.png", "folder/cover.png", "..\\cover.png", "cover..png", "cover"})
    void rejectsDangerousOrAmbiguousNames(String name) throws Exception {
        assertThrows(BusinessRuleException.class, () -> storage.storeFile(new MockMultipartFile("file", name, "image/png", image("png"))));
    }
    @ParameterizedTest @ValueSource(strings={"<html><script>alert(1)</script></html>", "<svg xmlns='http://www.w3.org/2000/svg'/>", "random bytes"})
    void rejectsSpoofedRasterContent(String payload) {
        assertThrows(BusinessRuleException.class, () -> storage.storeFile(new MockMultipartFile("file", "cover.png", "image/png", payload.getBytes())));
    }
    @Test void rejectsOversize() {
        assertThrows(BusinessRuleException.class, () -> storage.storeFile(new MockMultipartFile("file", "cover.png", "image/png", new byte[5*1024*1024+1])));
    }
    @Test void rejectsDimensionBombBeforePixelDecode() throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(8193, 1, BufferedImage.TYPE_INT_RGB), "png", out);
        assertThrows(BusinessRuleException.class, () -> storage.storeFile(new MockMultipartFile("file", "cover.png", "image/png", out.toByteArray())));
    }
    @Test void discardsTrailingScriptPayload() throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(image("png")); out.write("<script>alert(1)</script>".getBytes());
        var result = storage.storeFile(new MockMultipartFile("file", "cover.png", "image/png", out.toByteArray()));
        byte[] stored = Files.readAllBytes(directory.resolve("destinations").resolve(result.getFilename()));
        assertFalse(new String(stored, java.nio.charset.StandardCharsets.ISO_8859_1).contains("<script>"));
    }
    @Test void extensionMustMatchDecodedFormat() throws Exception {
        assertThrows(BusinessRuleException.class, () -> storage.storeFile(new MockMultipartFile("file", "cover.jpg", "image/jpeg", image("png"))));
    }
    @Test void validWebpAcceptedAndSanitizedAsPng() throws Exception {
        // Minimal lossless WebP fixture: one white pixel, decoded by TwelveMonkeys.
        byte[] bytes = java.util.Base64.getDecoder().decode("UklGRiIAAABXRUJQVlA4TBUAAAAvAAAAAAfQ//73v/+BiOh/AAA=");
        var result = storage.storeFile(new MockMultipartFile("file", "cover.webp", "image/webp", bytes));
        assertTrue(result.getFilename().endsWith(".png"));
        assertEquals("image/png", result.getMimeType());
    }
}
