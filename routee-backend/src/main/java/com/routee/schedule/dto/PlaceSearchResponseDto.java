package com.routee.schedule.dto;

import com.routee.schedule.entity.Place;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaceSearchResponseDto {
    private Long placeId;        // 추가 — 폴더 저장 여부 매칭용
    private String googlePlaceId;
    private String placeName;
    private String address;
    private Double latitude;
    private Double longitude;
    private String category;
    private Double rating;
    private String phoneNumber;
    private String openingHoursJson;

    public static PlaceSearchResponseDto of(Place place) {
        return PlaceSearchResponseDto.builder()
                .placeId(place.getPlaceId())
                .googlePlaceId(place.getGooglePlaceId())
                .placeName(place.getPlaceName())
                .address(place.getAddress())
                .latitude(place.getLatitude())
                .longitude(place.getLongitude())
                .category(place.getCategory())
                .rating(place.getRating())
                .phoneNumber(place.getPhoneNumber())
                .openingHoursJson(place.getOpeningHoursJson())
                .build();
    }
}
