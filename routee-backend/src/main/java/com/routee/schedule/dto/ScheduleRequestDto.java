package com.routee.schedule.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@NoArgsConstructor
public class ScheduleRequestDto {
    private String title;
    private String destination;
    private int memberCount;
    private LocalDate startDate;
    private LocalDate endDate;
}
