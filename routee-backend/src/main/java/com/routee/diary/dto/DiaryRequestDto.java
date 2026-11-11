package com.routee.diary.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class DiaryRequestDto {
    private Long scheduleId;
    private String content;
    private String emoji;
    private String coverColor;
    private String photosJson;  // JSON 배열 문자열 "[\"base64...\", ...]"
}
