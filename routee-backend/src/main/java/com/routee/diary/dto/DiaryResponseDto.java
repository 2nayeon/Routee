package com.routee.diary.dto;

import com.routee.diary.entity.Diary;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class DiaryResponseDto {
    private Long diaryId;
    private Long scheduleId;
    private String scheduleTitle;
    private String destination;
    private String startDate;
    private String endDate;
    private String content;
    private String emoji;
    private String coverColor;
    private String photosJson;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DiaryResponseDto(Diary diary) {
        this.diaryId       = diary.getDiaryId();
        this.scheduleId    = diary.getSchedule().getScheduleId();
        this.scheduleTitle = diary.getSchedule().getTitle();
        this.destination   = diary.getSchedule().getDestination();
        this.startDate     = diary.getSchedule().getStartDate().toString();
        this.endDate       = diary.getSchedule().getEndDate().toString();
        this.content       = diary.getContent();
        this.emoji         = diary.getEmoji();
        this.coverColor    = diary.getCoverColor();
        this.photosJson    = diary.getPhotosJson();
        this.createdAt     = diary.getCreatedAt();
        this.updatedAt     = diary.getUpdatedAt();
    }
}
