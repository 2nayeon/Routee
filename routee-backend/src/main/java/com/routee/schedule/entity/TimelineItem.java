package com.routee.schedule.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "timeline_items")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
public class TimelineItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "timeline_item_id")
    private Long timelineItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private Schedule schedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = false)
    private Place place;

    @Column(name = "visit_order", nullable = false)
    private Integer visitOrder;

    @Column(name = "visit_time")
    private LocalTime visitTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;

    @Column(name = "conflict_warning", nullable = false)
    @Builder.Default
    private boolean conflictWarning = false;

    @Column(length = 500)
    private String memo;

    public void updateTimeAndMemo(LocalTime visitTime, LocalTime endTime, String memo) {
        this.visitTime = visitTime;
        this.endTime = endTime;
        this.memo = memo;
    }

    public void updateConflictWarning(boolean conflictWarning) {
        this.conflictWarning = conflictWarning;
    }

    public void updateVisitOrder(Integer visitOrder) {
        this.visitOrder = visitOrder;
    }
}
