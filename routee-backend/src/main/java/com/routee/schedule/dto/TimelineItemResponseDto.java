package com.routee.schedule.dto;

import com.routee.schedule.entity.TimelineItem;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
public class TimelineItemResponseDto {
    private Long timelineItemId;
    private Long placeId;
    private String placeName;
    private String address;
    private String category;
    private Double rating;
    private Integer visitOrder;
    private LocalDate visitDate;
    private LocalTime visitTime;
    private LocalTime endTime;
    private String memo;
    private boolean conflictWarning;

    public TimelineItemResponseDto(TimelineItem timelineItem) {
        this.timelineItemId = timelineItem.getTimelineItemId();
        this.placeId = timelineItem.getPlace().getPlaceId();
        this.placeName = timelineItem.getPlace().getPlaceName();
        this.address = timelineItem.getPlace().getAddress();
        this.category = timelineItem.getPlace().getCategory();
        this.rating = timelineItem.getPlace().getRating();
        this.visitOrder = timelineItem.getVisitOrder();
        this.visitDate = timelineItem.getVisitDate();
        this.visitTime = timelineItem.getVisitTime();
        this.endTime = timelineItem.getEndTime();
        this.memo = timelineItem.getMemo();
        this.conflictWarning = timelineItem.isConflictWarning();
    }
}
