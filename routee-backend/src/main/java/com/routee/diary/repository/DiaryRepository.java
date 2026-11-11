package com.routee.diary.repository;

import com.routee.diary.entity.Diary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DiaryRepository extends JpaRepository<Diary, Long> {

    List<Diary> findByUser_UserId(Long userId);

    Optional<Diary> findBySchedule_ScheduleId(Long scheduleId);

    boolean existsBySchedule_ScheduleId(Long scheduleId);
}
