package com.routee.schedule.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@NoArgsConstructor
public class TimelineItemRequestDto {
    private Long tmpPlaceId;
    private LocalDate visitDate;
}
