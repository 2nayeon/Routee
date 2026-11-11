package com.routee.schedule.dto;

import com.routee.schedule.entity.Schedule;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class ScheduleResponseDto {
    private Long scheduleId;
    private String title;
    private String destination;
    private int memberCount;
    private LocalDate startDate;
    private LocalDate endDate;
    private int placeCount;

    public ScheduleResponseDto(Schedule schedule, int placeCount) {
        this.scheduleId = schedule.getScheduleId();
        this.title = schedule.getTitle();
        this.destination = schedule.getDestination();
        this.memberCount = schedule.getMemberCount();
        this.startDate = schedule.getStartDate();
        this.endDate = schedule.getEndDate();
        this.placeCount = placeCount;
    }
}
