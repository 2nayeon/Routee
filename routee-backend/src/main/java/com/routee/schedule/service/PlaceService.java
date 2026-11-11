package com.routee.schedule.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.routee.schedule.dto.PlaceSearchResponseDto;
import com.routee.schedule.entity.Place;
import com.routee.schedule.repository.PlaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlaceService {

    private final PlaceRepository placeRepository;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${google.maps.api-key}")
    private String apiKey;

    // 장소 검색
    public List<PlaceSearchResponseDto> searchPlaces(String keyword) {
        String url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
                + "?query=" + keyword
                + "&language=ko"
                + "&key=" + apiKey;

        log.info("=== 구글 Places API 호출 URL: {}", url);

        String response = webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        log.info("=== 구글 Places API 응답: {}", response);

        return parseSearchResponse(response);
    }

    // 장소 저장 (upsert)
    @Transactional
    public Place saveOrGetPlace(String googlePlaceId) {
        return placeRepository.findByGooglePlaceId(googlePlaceId)
                .orElseGet(() -> {
                    Place detail = fetchPlaceDetail(googlePlaceId);
                    return placeRepository.save(detail);
                });
    }

    // Google Places API 상세 조회
    private Place fetchPlaceDetail(String googlePlaceId) {
        String url = "https://maps.googleapis.com/maps/api/place/details/json"
                + "?place_id=" + googlePlaceId
                + "&fields=place_id,name,formatted_address,geometry,types,formatted_phone_number,rating,opening_hours"
                + "&language=ko"
                + "&key=" + apiKey;

        String response = webClient.get()
                .uri(url)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return parsePlaceDetail(googlePlaceId, response);
    }

    // 검색 응답 파싱 — DB에 있는 장소면 placeId 함께 반환
    private List<PlaceSearchResponseDto> parseSearchResponse(String response) {
        List<PlaceSearchResponseDto> result = new ArrayList<>();
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode results = root.get("results");

            for (JsonNode item : results) {
                String googlePlaceId = item.path("place_id").asText();
                String placeName     = item.path("name").asText();
                String address       = item.path("formatted_address").asText();
                double latitude      = item.path("geometry").path("location").path("lat").asDouble();
                double longitude     = item.path("geometry").path("location").path("lng").asDouble();
                double rating        = item.path("rating").asDouble(0.0);
                String category      = item.path("types").get(0) != null
                        ? item.path("types").get(0).asText() : null;

                // DB에 이미 저장된 장소면 placeId 포함
                Optional<Place> dbPlace = placeRepository.findByGooglePlaceId(googlePlaceId);
                Long placeId = dbPlace.map(Place::getPlaceId).orElse(null);

                result.add(PlaceSearchResponseDto.builder()
                        .placeId(placeId)
                        .googlePlaceId(googlePlaceId)
                        .placeName(placeName)
                        .address(address)
                        .latitude(latitude)
                        .longitude(longitude)
                        .rating(rating)
                        .category(category)
                        .build());
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("장소 검색 결과 파싱 실패: " + e.getMessage());
        }
        return result;
    }

    // 상세 응답 파싱
    private Place parsePlaceDetail(String googlePlaceId, String response) {
        try {
            JsonNode root = objectMapper.readTree(response);
            String status = root.path("status").asText("");
            JsonNode result = root.path("result");

            if (!"OK".equals(status) || result.isMissingNode() || !result.has("name")) {
                throw new IllegalArgumentException(
                        "유효하지 않은 googlePlaceId 이거나 장소 정보를 찾을 수 없습니다. googlePlaceId=" + googlePlaceId
                                + ", status=" + status);
            }

            String placeName     = result.path("name").asText();
            String address       = result.path("formatted_address").asText();
            double latitude      = result.path("geometry").path("location").path("lat").asDouble();
            double longitude     = result.path("geometry").path("location").path("lng").asDouble();
            String phoneNumber   = result.path("formatted_phone_number").asText(null);
            double rating        = result.path("rating").asDouble(0.0);
            String category      = result.path("types").get(0) != null
                    ? result.path("types").get(0).asText() : null;
            String openingHoursJson = result.path("opening_hours").isMissingNode()
                    ? null : result.path("opening_hours").toString();

            return Place.builder()
                    .googlePlaceId(googlePlaceId)
                    .placeName(placeName)
                    .address(address)
                    .latitude(latitude)
                    .longitude(longitude)
                    .phoneNumber(phoneNumber)
                    .rating(rating)
                    .category(category)
                    .openingHoursJson(openingHoursJson)
                    .openingHoursUpdatedAt(LocalDateTime.now())
                    .build();

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("장소 상세 정보 파싱 실패: " + e.getMessage());
        }
    }
}
