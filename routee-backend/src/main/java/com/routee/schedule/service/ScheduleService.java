package com.routee.schedule.service;

import com.routee.auth.entity.User;
import com.routee.auth.repository.UserRepository;
import com.routee.folder.repository.FolderPlaceRepository;
import com.routee.folder.repository.FolderRepository;
import com.routee.schedule.dto.*;
import com.routee.schedule.entity.Place;
import com.routee.schedule.entity.Schedule;
import com.routee.schedule.entity.ScheduleTmpPlace;
import com.routee.schedule.entity.TimelineItem;
import com.routee.schedule.repository.PlaceRepository;
import com.routee.schedule.repository.ScheduleRepository;
import com.routee.schedule.repository.ScheduleTmpPlaceRepository;
import com.routee.schedule.repository.TimelineItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final UserRepository userRepository;
    private final ScheduleRepository scheduleRepository;
    private final PlaceRepository placeRepository;
    private final ScheduleTmpPlaceRepository scheduleTmpPlaceRepository;
    private final TimelineItemRepository timelineItemRepository;
    private final ConflictDetector conflictDetector;
    private final FolderRepository folderRepository;
    private final FolderPlaceRepository folderPlaceRepository;

    @Transactional
    public Long createSchedule(Long userId, ScheduleRequestDto requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다. id=" + userId));

        Schedule newSchedule = Schedule.builder()
                .title(requestDto.getTitle())
                .destination(requestDto.getDestination())
                .memberCount(requestDto.getMemberCount())
                .startDate(requestDto.getStartDate())
                .endDate(requestDto.getEndDate())
                .user(user)
                .build();

        return scheduleRepository.save(newSchedule).getScheduleId();
    }

    @Transactional
    public TmpPlaceResponseDto addTmpPlace(Long scheduleId, PlaceRequestDto requestDto) {
        Place place = placeRepository.findByGooglePlaceId(requestDto.getGooglePlaceId())
                .orElseGet(() -> placeRepository.save(Place.builder()
                        .googlePlaceId(requestDto.getGooglePlaceId())
                        .placeName(requestDto.getPlaceName())
                        .address(requestDto.getAddress())
                        .latitude(requestDto.getLatitude())
                        .longitude(requestDto.getLongitude())
                        .category(requestDto.getCategory())
                        .phoneNumber(requestDto.getPhoneNumber())
                        .website(requestDto.getWebsite())
                        .rating(requestDto.getRating())
                        .openingHoursJson(requestDto.getOpeningHoursJson())
                        .build()));

        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 일정입니다."));

        if (scheduleTmpPlaceRepository.existsByScheduleAndPlace(schedule, place)) {
            throw new IllegalArgumentException("이미 임시 보관함에 있는 장소입니다.");
        }

        ScheduleTmpPlace tmpPlace = ScheduleTmpPlace.builder()
                .schedule(schedule)
                .place(place)
                .build();

        return new TmpPlaceResponseDto(scheduleTmpPlaceRepository.save(tmpPlace));
    }

    @Transactional
    public TimelineItemResponseDto addTimelineItem(Long scheduleId, TimelineItemRequestDto requestDto) {
        ScheduleTmpPlace tmpPlace = scheduleTmpPlaceRepository.findById(requestDto.getTmpPlaceId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 임시 장소입니다. id=" + requestDto.getTmpPlaceId()));

        int nextOrder = timelineItemRepository
                .countByScheduleAndVisitDate(tmpPlace.getSchedule(), requestDto.getVisitDate()) + 1;

        TimelineItem timelineItem = TimelineItem.builder()
                .schedule(tmpPlace.getSchedule())
                .place(tmpPlace.getPlace())
                .visitOrder(nextOrder)
                .visitDate(requestDto.getVisitDate())
                .build();

        TimelineItem saved = timelineItemRepository.save(timelineItem);
        scheduleTmpPlaceRepository.delete(tmpPlace);

        return new TimelineItemResponseDto(saved);
    }

    @Transactional
    public TimelineItemResponseDto updateTimelineItem(Long scheduleId, Long itemId, TimelineItemUpdateRequestDto requestDto) {
        TimelineItem timelineItem = timelineItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 타임라인 항목입니다. id=" + itemId));

        if (!timelineItem.getSchedule().getScheduleId().equals(scheduleId)) {
            throw new IllegalArgumentException("해당 일정의 타임라인 항목이 아닙니다.");
        }

        timelineItem.updateTimeAndMemo(
                requestDto.getVisitTime(),
                requestDto.getEndTime(),
                requestDto.getMemo()
        );

        // ── 충돌 감지: 영업시간 OR 시간 겹침 ──────────────────────────
        String openingHoursJson = timelineItem.getPlace().getOpeningHoursJson();

        // 1. 영업시간 충돌
        boolean businessHoursConflict = conflictDetector.hasBusinessHoursConflict(
                requestDto.getVisitTime(), openingHoursJson
        );

        // 2. 같은 날 다른 아이템과 시간 겹침
        List<TimelineItem> sameDayItems = timelineItemRepository
                .findByScheduleScheduleIdAndVisitDate(scheduleId, timelineItem.getVisitDate());

        boolean overlapConflict = conflictDetector.hasTimeOverlapConflict(timelineItem, sameDayItems);

        // 둘 중 하나라도 충돌이면 true
        timelineItem.updateConflictWarning(businessHoursConflict || overlapConflict);

        // ── 같은 날 다른 아이템들의 conflictWarning도 재계산 ────────────
        // (현재 아이템 시간이 바뀌면 다른 아이템 충돌 여부도 달라질 수 있음)
        for (TimelineItem other : sameDayItems) {
            if (other.getTimelineItemId().equals(itemId)) continue;

            boolean otherBusinessConflict = conflictDetector.hasBusinessHoursConflict(
                    other.getVisitTime(), other.getPlace().getOpeningHoursJson()
            );
            boolean otherOverlapConflict = conflictDetector.hasTimeOverlapConflict(other, sameDayItems);
            other.updateConflictWarning(otherBusinessConflict || otherOverlapConflict);
        }

        return new TimelineItemResponseDto(timelineItem);
    }

    @Transactional(readOnly = true)
    public ScheduleDetailResponseDto getScheduleDetail(Long scheduleId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 일정입니다. id=" + scheduleId));

        List<TmpPlaceResponseDto> tmpPlaces = scheduleTmpPlaceRepository
                .findByScheduleScheduleId(scheduleId)
                .stream()
                .map(TmpPlaceResponseDto::new)
                .collect(Collectors.toList());

        Map<LocalDate, List<TimelineItemResponseDto>> timeline = timelineItemRepository
                .findByScheduleScheduleId(scheduleId)
                .stream()
                .map(TimelineItemResponseDto::new)
                .collect(Collectors.groupingBy(TimelineItemResponseDto::getVisitDate));

        return new ScheduleDetailResponseDto(schedule, tmpPlaces, timeline);
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponseDto> getMySchedules(Long userId) {
        return scheduleRepository.findByUserUserId(userId)
                .stream()
                .map(schedule -> new ScheduleResponseDto(
                        schedule,
                        timelineItemRepository.countByScheduleScheduleId(schedule.getScheduleId())
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<TmpPlaceResponseDto> addTmpPlacesFromFolder(Long scheduleId, Long userId, FolderToTmpRequestDto requestDto) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 일정입니다."));

        if (!schedule.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }

        com.routee.folder.entity.Folder folder = folderRepository.findById(requestDto.getFolderId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 폴더입니다."));

        if (!folder.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("해당 폴더에 접근 권한이 없습니다.");
        }

        List<com.routee.folder.entity.FolderPlace> folderPlaces =
                folderPlaceRepository.findByFolder_FolderId(requestDto.getFolderId())
                        .stream()
                        .filter(fp -> requestDto.getPlaceIds().contains(fp.getPlace().getPlaceId()))
                        .collect(Collectors.toList());

        List<TmpPlaceResponseDto> result = new ArrayList<>();
        for (com.routee.folder.entity.FolderPlace fp : folderPlaces) {
            Place place = fp.getPlace();

            ScheduleTmpPlace tmpPlace = scheduleTmpPlaceRepository.findByScheduleAndPlace(schedule, place)
                    .orElseGet(() -> scheduleTmpPlaceRepository.save(
                            ScheduleTmpPlace.builder().schedule(schedule).place(place).build()
                    ));

            result.add(new TmpPlaceResponseDto(tmpPlace));
        }

        return result;
    }

    @Transactional
    public List<TimelineItemResponseDto> reorderTimelineItems(Long scheduleId, Long userId, TimelineReorderRequestDto requestDto) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 일정입니다."));

        if (!schedule.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }

        List<TimelineItemResponseDto> result = new ArrayList<>();
        for (TimelineReorderRequestDto.TimelineOrderItem orderItem : requestDto.getOrders()) {
            TimelineItem timelineItem = timelineItemRepository.findById(orderItem.getTimelineItemId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 타임라인 항목입니다. id=" + orderItem.getTimelineItemId()));

            if (!timelineItem.getSchedule().getScheduleId().equals(scheduleId)) {
                throw new IllegalArgumentException("해당 일정의 타임라인 항목이 아닙니다.");
            }

            timelineItem.updateVisitOrder(orderItem.getVisitOrder());
            result.add(new TimelineItemResponseDto(timelineItem));
        }

        return result;
    }

    @Transactional
    public ScheduleResponseDto updateSchedule(Long scheduleId, Long userId, ScheduleUpdateRequestDto requestDto) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 일정입니다."));

        if (!schedule.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }

        schedule.update(
                requestDto.getTitle(),
                requestDto.getDestination(),
                requestDto.getMemberCount(),
                requestDto.getStartDate(),
                requestDto.getEndDate()
        );

        return new ScheduleResponseDto(schedule, timelineItemRepository.countByScheduleScheduleId(scheduleId));
    }

    @Transactional
    public void deleteSchedule(Long scheduleId, Long userId) {
        Schedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 일정입니다."));

        if (!schedule.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }

        scheduleRepository.delete(schedule);
    }

    @Transactional
    public void deleteTimelineItem(Long scheduleId, Long userId, Long itemId) {
        TimelineItem timelineItem = timelineItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 타임라인 항목입니다. id=" + itemId));

        if (!timelineItem.getSchedule().getScheduleId().equals(scheduleId)) {
            throw new IllegalArgumentException("해당 일정의 타임라인 항목이 아닙니다.");
        }

        if (!timelineItem.getSchedule().getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }

        LocalDate visitDate = timelineItem.getVisitDate();

        timelineItemRepository.delete(timelineItem);

        // ── 같은 날 남은 아이템들의 conflictWarning 재계산 ──────────────
        // (삭제된 아이템과 겹쳐서 충돌이었던 항목은, 삭제 후 더 이상 충돌이 아닐 수 있음)
        List<TimelineItem> sameDayItems = timelineItemRepository
                .findByScheduleScheduleIdAndVisitDate(scheduleId, visitDate);

        for (TimelineItem other : sameDayItems) {
            boolean businessConflict = conflictDetector.hasBusinessHoursConflict(
                    other.getVisitTime(), other.getPlace().getOpeningHoursJson()
            );
            boolean overlapConflict = conflictDetector.hasTimeOverlapConflict(other, sameDayItems);
            other.updateConflictWarning(businessConflict || overlapConflict);
        }
    }
}
