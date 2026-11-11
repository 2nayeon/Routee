package com.routee.schedule.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class ScheduleUpdateRequestDto {
    private String title;
    private String destination;
    private int memberCount;
    private LocalDate startDate;
    private LocalDate endDate;
}