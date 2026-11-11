package com.routee.folder.controller;

import com.routee.folder.dto.FolderPlaceRequestDto;
import com.routee.folder.dto.FolderPlaceResponseDto;
import com.routee.folder.dto.FolderRequestDto;
import com.routee.folder.dto.FolderResponseDto;
import com.routee.folder.service.FolderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/folders")
public class FolderController {

    private final FolderService folderService;

    @PostMapping("/new")
    public ResponseEntity<FolderResponseDto> createFolder(
            @RequestBody FolderRequestDto request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(folderService.createFolder(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<FolderResponseDto>> getFolders() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(folderService.getFolders(userId));
    }

    @GetMapping("/{folderId}")
    public ResponseEntity<List<FolderPlaceResponseDto>> getFolderPlaces(
            @PathVariable Long folderId) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(folderService.getFolderPlaces(folderId, userId));
    }

    @DeleteMapping("/{folderId}")
    public ResponseEntity<Void> deleteFolder(
            @PathVariable Long folderId) {
        Long userId = getCurrentUserId();
        folderService.deleteFolder(folderId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{folderId}/places")
    public ResponseEntity<FolderPlaceResponseDto> addPlaceToFolder(
            @PathVariable Long folderId,
            @RequestBody FolderPlaceRequestDto request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(folderService.addPlaceToFolder(folderId, userId, request));
    }

    @DeleteMapping("/{folderId}/places/{placeId}")
    public ResponseEntity<Void> removePlaceFromFolder(
            @PathVariable Long folderId,
            @PathVariable Long placeId) {
        Long userId = getCurrentUserId();
        folderService.removePlaceFromFolder(folderId, placeId, userId);
        return ResponseEntity.noContent().build();
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Long) authentication.getPrincipal();
    }
}