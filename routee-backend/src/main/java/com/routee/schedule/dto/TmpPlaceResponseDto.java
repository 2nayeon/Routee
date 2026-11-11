package com.routee.schedule.dto;

import com.routee.schedule.entity.ScheduleTmpPlace;
import lombok.Getter;

@Getter
public class TmpPlaceResponseDto {
    private Long tmpPlaceId;
    private Long placeId;
    private String googlePlaceId;
    private String placeName;
    private String address;
    private String category;
    private String phoneNumber;
    private String website;
    private Double rating;
    private String openingHoursJson;

    public TmpPlaceResponseDto(ScheduleTmpPlace tmpPlace) {
        this.tmpPlaceId = tmpPlace.getTmpPlaceId();
        this.placeId = tmpPlace.getPlace().getPlaceId();
        this.googlePlaceId = tmpPlace.getPlace().getGooglePlaceId();
        this.placeName = tmpPlace.getPlace().getPlaceName();
        this.address = tmpPlace.getPlace().getAddress();
        this.category = tmpPlace.getPlace().getCategory();
        this.phoneNumber = tmpPlace.getPlace().getPhoneNumber();
        this.website = tmpPlace.getPlace().getWebsite();
        this.rating = tmpPlace.getPlace().getRating();
        this.openingHoursJson = tmpPlace.getPlace().getOpeningHoursJson();
    }
}
