package com.lankastay.backend.controller;

import com.lankastay.backend.dto.media.MediaUploadResponse;
import com.lankastay.backend.service.MediaStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/media")
public class MediaController {

    private final MediaStorageService mediaStorageService;

    public MediaController(MediaStorageService mediaStorageService) {
        this.mediaStorageService = mediaStorageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<MediaUploadResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        MediaUploadResponse response = mediaStorageService.storeFile(file);
        return ResponseEntity.ok(response);
    }
}
