package com.routee.diary.service;

import com.routee.auth.entity.User;
import com.routee.auth.repository.UserRepository;
import com.routee.diary.dto.DiaryRequestDto;
import com.routee.diary.dto.DiaryResponseDto;
import com.routee.diary.entity.Diary;
import com.routee.diary.repository.DiaryRepository;
import com.routee.schedule.entity.Schedule;
import com.routee.schedule.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiaryService {

    private final DiaryRepository diaryRepository;
    private final UserRepository userRepository;
    private final ScheduleRepository scheduleRepository;

    // 다이어리 생성
    @Transactional
    public DiaryResponseDto createDiary(Long userId, DiaryRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        Schedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 일정입니다."));

        if (!schedule.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }

        if (diaryRepository.existsBySchedule_ScheduleId(request.getScheduleId())) {
            throw new IllegalArgumentException("이미 다이어리가 존재합니다. 수정을 이용해주세요.");
        }

        Diary diary = Diary.builder()
                .user(user)
                .schedule(schedule)
                .content(request.getContent())
                .emoji(request.getEmoji() != null ? request.getEmoji() : "✈️")
                .coverColor(request.getCoverColor() != null ? request.getCoverColor() : "#4F46E5")
                .photosJson(request.getPhotosJson())
                .build();

        return new DiaryResponseDto(diaryRepository.save(diary));
    }

    // 내 다이어리 목록
    public List<DiaryResponseDto> getMyDiaries(Long userId) {
        return diaryRepository.findByUser_UserId(userId)
                .stream()
                .map(DiaryResponseDto::new)
                .collect(Collectors.toList());
    }

    // 다이어리 상세
    public DiaryResponseDto getDiary(Long diaryId, Long userId) {
        Diary diary = diaryRepository.findById(diaryId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 다이어리입니다."));

        if (!diary.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }

        return new DiaryResponseDto(diary);
    }

    // 일정 ID로 다이어리 조회
    public DiaryResponseDto getDiaryBySchedule(Long scheduleId, Long userId) {
        Diary diary = diaryRepository.findBySchedule_ScheduleId(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("다이어리가 없습니다."));

        if (!diary.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }

        return new DiaryResponseDto(diary);
    }

    // 다이어리 수정
    @Transactional
    public DiaryResponseDto updateDiary(Long diaryId, Long userId, DiaryRequestDto request) {
        Diary diary = diaryRepository.findById(diaryId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 다이어리입니다."));

        if (!diary.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }

        diary.update(request.getContent(), request.getEmoji(),
                request.getCoverColor(), request.getPhotosJson());

        return new DiaryResponseDto(diary);
    }

    // 다이어리 삭제
    @Transactional
    public void deleteDiary(Long diaryId, Long userId) {
        Diary diary = diaryRepository.findById(diaryId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 다이어리입니다."));

        if (!diary.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }

        diaryRepository.delete(diary);
    }
}
