package com.routee.schedule.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class TimelineReorderRequestDto {
    private List<TimelineOrderItem> orders;

    @Getter
    @NoArgsConstructor
    public static class TimelineOrderItem {
        private Long timelineItemId;
        private Integer visitOrder;
    }
}