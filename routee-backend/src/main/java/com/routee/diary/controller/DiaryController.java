package com.routee.diary.controller;

import com.routee.diary.dto.DiaryRequestDto;
import com.routee.diary.dto.DiaryResponseDto;
import com.routee.diary.service.DiaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/diaries")
public class DiaryController {

    private final DiaryService diaryService;

    // 다이어리 생성
    @PostMapping
    public ResponseEntity<DiaryResponseDto> createDiary(@RequestBody DiaryRequestDto request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(diaryService.createDiary(userId, request));
    }

    // 내 다이어리 목록
    @GetMapping
    public ResponseEntity<List<DiaryResponseDto>> getMyDiaries() {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(diaryService.getMyDiaries(userId));
    }

    // 다이어리 상세
    @GetMapping("/{diaryId}")
    public ResponseEntity<DiaryResponseDto> getDiary(@PathVariable Long diaryId) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(diaryService.getDiary(diaryId, userId));
    }

    // 일정 ID로 다이어리 조회
    @GetMapping("/schedule/{scheduleId}")
    public ResponseEntity<DiaryResponseDto> getDiaryBySchedule(@PathVariable Long scheduleId) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(diaryService.getDiaryBySchedule(scheduleId, userId));
    }

    // 다이어리 수정
    @PatchMapping("/{diaryId}")
    public ResponseEntity<DiaryResponseDto> updateDiary(
            @PathVariable Long diaryId,
            @RequestBody DiaryRequestDto request) {
        Long userId = getCurrentUserId();
        return ResponseEntity.ok(diaryService.updateDiary(diaryId, userId, request));
    }

    // 다이어리 삭제
    @DeleteMapping("/{diaryId}")
    public ResponseEntity<Void> deleteDiary(@PathVariable Long diaryId) {
        Long userId = getCurrentUserId();
        diaryService.deleteDiary(diaryId, userId);
        return ResponseEntity.noContent().build();
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Long) authentication.getPrincipal();
    }
}
