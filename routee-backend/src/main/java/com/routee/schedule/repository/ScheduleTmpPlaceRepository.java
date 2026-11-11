package com.routee.schedule.repository;

import com.routee.schedule.dto.TmpPlaceResponseDto;
import com.routee.schedule.entity.Place;
import com.routee.schedule.entity.Schedule;
import com.routee.schedule.entity.ScheduleTmpPlace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduleTmpPlaceRepository extends JpaRepository<ScheduleTmpPlace, Long> {
    boolean existsByScheduleAndPlace(Schedule schedule, Place place);

    Optional<ScheduleTmpPlace> findByScheduleAndPlace(Schedule schedule, Place place);

    List<ScheduleTmpPlace> findByScheduleScheduleId(Long scheduleId);
}
