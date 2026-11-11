package com.routee.schedule.controller;

import com.routee.schedule.dto.*;
import com.routee.schedule.entity.Schedule;
import com.routee.schedule.service.ScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @PostMapping("/new")
    public ResponseEntity<Long> createSchedule(
            @RequestBody ScheduleRequestDto requestDto) {
        Long userId = getCurrentUserId();
        Long scheduleId = scheduleService.createSchedule(userId, requestDto);
        return ResponseEntity.ok(scheduleId);
    }

    @PostMapping("{scheduleId}/tmp-places")
    public ResponseEntity<TmpPlaceResponseDto> addTmpPlace(
            @PathVariable(name = "scheduleId") Long scheduleId,
            @RequestBody PlaceRequestDto requestDto) {
        TmpPlaceResponseDto responseDto = scheduleService.addTmpPlace(scheduleId, requestDto);
        return ResponseEntity.ok(responseDto);
    }

    @PostMapping("{scheduleId}/timeline-items")
    public ResponseEntity<TimelineItemResponseDto> addTimelineItem(
            @PathVariable(name = "scheduleId") Long scheduleId,
            @RequestBody TimelineItemRequestDto requestDto) {
        TimelineItemResponseDto responseDto = scheduleService.addTimelineItem(scheduleId, requestDto);
        return ResponseEntity.ok(responseDto);
    }

    @PatchMapping("{scheduleId}/timeline-items/{itemId}")
    public ResponseEntity<TimelineItemResponseDto> updateTimelineItem(
            @PathVariable Long scheduleId,
            @PathVariable Long itemId,
            @RequestBody TimelineItemUpdateRequestDto requestDto
    ) {
        TimelineItemResponseDto responseDto = scheduleService.updateTimelineItem(scheduleId, itemId, requestDto);
        return ResponseEntity.ok(responseDto);
    }

    @DeleteMapping("{scheduleId}/timeline-items/{itemId}")
    public ResponseEntity<Void> deleteTimelineItem(
            @PathVariable Long scheduleId,
            @PathVariable Long itemId) {
        Long userId = getCurrentUserId();
        scheduleService.deleteTimelineItem(scheduleId, userId, itemId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<ScheduleResponseDto>> getMySchedules() {
        Long userId = getCurrentUserId();
        List<ScheduleResponseDto> responseDtoList = scheduleService.getMySchedules(userId);
        return ResponseEntity.ok(responseDtoList);
    }

    @GetMapping("{scheduleId}")
    public ResponseEntity<ScheduleDetailResponseDto> getScheduleDetail(@PathVariable Long scheduleId) {
        ScheduleDetailResponseDto responseDto = scheduleService.getScheduleDetail(scheduleId);
        return ResponseEntity.ok(responseDto);
    }

    @PostMapping("{scheduleId}/tmp-places/from-folder")
    public ResponseEntity<List<TmpPlaceResponseDto>> addTmpPlacesFromFolder(
            @PathVariable Long scheduleId,
            @RequestBody FolderToTmpRequestDto requestDto) {
        Long userId = getCurrentUserId();
        List<TmpPlaceResponseDto> result = scheduleService.addTmpPlacesFromFolder(scheduleId, userId, requestDto);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("{scheduleId}/timeline-items/reorder")
    public ResponseEntity<List<TimelineItemResponseDto>> reorderTimelineItems(
            @PathVariable Long scheduleId,
            @RequestBody TimelineReorderRequestDto requestDto) {
        Long userId = getCurrentUserId();
        List<TimelineItemResponseDto> result = scheduleService.reorderTimelineItems(scheduleId, userId, requestDto);
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{scheduleId}")
    public ResponseEntity<ScheduleResponseDto> updateSchedule(
            @PathVariable Long scheduleId,
            @RequestBody ScheduleUpdateRequestDto requestDto) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(scheduleService.updateSchedule(scheduleId, userId, requestDto));
    }

    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<Void> deleteSchedule(
            @PathVariable Long scheduleId) {
        Long userId = getCurrentUserId();
        scheduleService.deleteSchedule(scheduleId, userId);
        return ResponseEntity.noContent().build();
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Long) authentication.getPrincipal();
    }
}
