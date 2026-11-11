package com.routee.schedule.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "places")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
public class Place {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "place_id")
    private Long placeId;

    @Column(name = "google_place_id", nullable = false, unique = true, length = 255)
    private String googlePlaceId;

    @Column(name = "place_name", nullable = false, length = 150)
    private String placeName;

    @Column(length = 255)
    private String address;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(length = 100)
    private String category;

    @Column(name = "phone_number", length = 30)
    private String phoneNumber;

    @Column(length = 255)
    private String website;

    @Column
    private Double rating;

    @Column(name = "opening_hours_json", columnDefinition = "TEXT")
    private String openingHoursJson;

    @Column(name = "opening_hours_updated_at")
    private LocalDateTime openingHoursUpdatedAt;
}
