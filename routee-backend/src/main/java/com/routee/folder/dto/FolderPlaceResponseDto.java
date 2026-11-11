package com.routee.folder.dto;

import com.routee.schedule.entity.Place;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FolderPlaceResponseDto {
    private Long placeId;
    private String googlePlaceId;
    private String placeName;
    private String address;
    private String category;
    private String phoneNumber;
    private Double rating;
    private String openingHoursJson;

    public static FolderPlaceResponseDto of(Place place) {
        return FolderPlaceResponseDto.builder()
                .placeId(place.getPlaceId())
                .googlePlaceId(place.getGooglePlaceId())
                .placeName(place.getPlaceName())
                .address(place.getAddress())
                .category(place.getCategory())
                .phoneNumber(place.getPhoneNumber())
                .rating(place.getRating())
                .openingHoursJson(place.getOpeningHoursJson())
                .build();
    }
}
