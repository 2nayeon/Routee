package com.routee.schedule.dto;

import com.routee.schedule.entity.Schedule;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Getter
public class ScheduleDetailResponseDto {
    private Long scheduleId;
    private String title;
    private String destination;
    private int memberCount;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<TmpPlaceResponseDto> tmpPlaces;
    private Map<LocalDate, List<TimelineItemResponseDto>> timeline;

    public ScheduleDetailResponseDto(Schedule schedule,
                                     List<TmpPlaceResponseDto> tmpPlaces,
                                     Map<LocalDate, List<TimelineItemResponseDto>> timeline) {
        this.scheduleId = schedule.getScheduleId();
        this.title = schedule.getTitle();
        this.destination = schedule.getDestination();
        this.memberCount = schedule.getMemberCount();
        this.startDate = schedule.getStartDate();
        this.endDate = schedule.getEndDate();
        this.tmpPlaces = tmpPlaces;
        this.timeline = timeline;
    }
}
