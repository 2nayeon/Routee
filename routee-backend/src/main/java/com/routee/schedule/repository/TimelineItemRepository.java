package com.routee.schedule.repository;

import com.routee.schedule.entity.Schedule;
import com.routee.schedule.entity.TimelineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TimelineItemRepository extends JpaRepository<TimelineItem, Long> {
    List<TimelineItem> findByScheduleScheduleId(Long scheduleId);

    int countByScheduleScheduleId(Long scheduleId);

    int countByScheduleAndVisitDate(Schedule schedule, LocalDate visitDate);

    List<TimelineItem> findByScheduleScheduleIdAndVisitDate(Long scheduleId, LocalDate visitDate);
}
