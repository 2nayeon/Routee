package com.routee.folder.dto;

import com.routee.folder.entity.Folder;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FolderResponseDto {
    private Long folderId;
    private String folderName;
    private int placeCount;
    private LocalDateTime createdAt;

    public static FolderResponseDto of(Folder folder, int placeCount) {
        return FolderResponseDto.builder()
                .folderId(folder.getFolderId())
                .folderName(folder.getFolderName())
                .placeCount(placeCount)
                .createdAt(folder.getCreatedAt())
                .build();
    }
}
