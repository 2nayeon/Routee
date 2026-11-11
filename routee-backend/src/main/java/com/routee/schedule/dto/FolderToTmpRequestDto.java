package com.routee.schedule.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class FolderToTmpRequestDto {
    private Long folderId;
    private List<Long> placeIds; // 선택한 장소들
}