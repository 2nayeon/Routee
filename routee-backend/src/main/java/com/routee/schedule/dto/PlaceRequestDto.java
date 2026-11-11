package com.routee.schedule.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class PlaceRequestDto {
    private String googlePlaceId;
    private String placeName;
    private String address;
    private Double latitude;
    private Double longitude;
    private String category;
    private String phoneNumber;
    private String website;
    private Double rating;
    private String openingHoursJson;
}
