package com.routee.schedule.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.routee.schedule.entity.TimelineItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ConflictDetector {

    private final ObjectMapper objectMapper;

    /**
     * visitTime이 영업시간 밖이면 true (충돌)
     */
    public boolean hasBusinessHoursConflict(LocalTime visitTime, String openingHoursJson) {
        if (visitTime == null || openingHoursJson == null) return false;

        try {
            JsonNode root = objectMapper.readTree(openingHoursJson);
            JsonNode periods = root.path("periods");

            if (periods.isMissingNode() || periods.isEmpty()) return false;

            for (JsonNode period : periods) {
                JsonNode open  = period.path("open");
                JsonNode close = period.path("close");

                if (close.isMissingNode()) return false; // 24시간 영업

                LocalTime openTime  = parseTime(open.path("time").asText(null));
                LocalTime closeTime = parseTime(close.path("time").asText(null));

                if (openTime == null || closeTime == null) continue; // 파싱 실패한 period는 스킵

                if (closeTime.isBefore(openTime)) {
                    // 자정 넘기는 케이스 (22:00 ~ 02:00)
                    if (!visitTime.isBefore(openTime) || !visitTime.isAfter(closeTime)) return false;
                } else {
                    if (!visitTime.isBefore(openTime) && !visitTime.isAfter(closeTime)) return false;
                }
            }

            return true; // 어떤 period에도 해당 안 됨 → 충돌

        } catch (Exception e) {
            log.warn("영업시간 파싱 실패, 충돌 없음으로 처리: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Google Places opening_hours의 "time" 필드("HHMM" 4자리 문자열)를 LocalTime으로 변환
     * 형식이 올바르지 않으면 null 반환
     */
    private LocalTime parseTime(String hhmm) {
        if (hhmm == null || hhmm.length() != 4) return null;

        try {
            int hour = Integer.parseInt(hhmm.substring(0, 2));
            int minute = Integer.parseInt(hhmm.substring(2, 4));

            if (hour == 24) hour = 0; // "2400" 자정 표기 보정

            return LocalTime.of(hour, minute);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 같은 날 다른 아이템과 시간이 겹치는지 체크
     * targetItem을 제외한 sameDay 아이템들과 비교
     */
    public boolean hasTimeOverlapConflict(TimelineItem target, List<TimelineItem> sameDayItems) {
        if (target.getVisitTime() == null || target.getEndTime() == null) return false;

        for (TimelineItem other : sameDayItems) {
            if (other.getTimelineItemId().equals(target.getTimelineItemId())) continue;
            if (other.getVisitTime() == null || other.getEndTime() == null) continue;

            // 시간 겹침: A.start < B.end && B.start < A.end
            boolean overlap = target.getVisitTime().isBefore(other.getEndTime())
                    && other.getVisitTime().isBefore(target.getEndTime());

            if (overlap) return true;
        }
        return false;
    }

    /**
     * 영업시간 충돌 OR 시간 겹침 중 하나라도 있으면 true
     */
    public boolean hasConflict(LocalTime visitTime, String openingHoursJson) {
        return hasBusinessHoursConflict(visitTime, openingHoursJson);
    }
}
