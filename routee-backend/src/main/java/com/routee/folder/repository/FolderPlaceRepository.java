package com.routee.folder.repository;

import com.routee.folder.entity.FolderPlace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FolderPlaceRepository extends JpaRepository<FolderPlace, Long> {
    List<FolderPlace> findByFolder_FolderId(Long folderId);

    int countByFolder_FolderId(Long folderId);

    boolean existsByFolder_FolderIdAndPlace_PlaceId(Long folderId, Long placeId);

    Optional<FolderPlace> findByFolder_FolderIdAndPlace_PlaceId(Long folderId, Long placeId);
}
