package com.routee.schedule.repository;

import com.routee.schedule.entity.Place;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlaceRepository extends JpaRepository<Place, Long> {
    Optional<Place> findByGooglePlaceId(String googlePlaceId);
}
