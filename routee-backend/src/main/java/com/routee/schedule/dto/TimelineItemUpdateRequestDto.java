package com.routee.schedule.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@NoArgsConstructor
public class TimelineItemUpdateRequestDto {
    private LocalTime visitTime;
    private LocalTime endTime;
    private String memo;
}
