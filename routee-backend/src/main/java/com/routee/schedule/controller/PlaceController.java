package com.routee.schedule.controller;

import com.routee.schedule.dto.PlaceSearchResponseDto;
import com.routee.schedule.entity.Place;
import com.routee.schedule.service.PlaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/places")
public class PlaceController {

    private final PlaceService placeService;

    // 장소 검색
    @GetMapping("/search")
    public ResponseEntity<List<PlaceSearchResponseDto>> searchPlaces(
            @RequestParam String keyword) {
        return ResponseEntity.ok(placeService.searchPlaces(keyword));
    }

    // 장소 저장 (좋아요 누를 때 placeId 확보용)
    @PostMapping("/save")
    public ResponseEntity<Long> savePlace(@RequestParam String googlePlaceId) {
        Place place = placeService.saveOrGetPlace(googlePlaceId);
        return ResponseEntity.ok(place.getPlaceId());
    }
}