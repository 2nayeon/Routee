package com.routee.folder.service;

import com.routee.auth.entity.User;
import com.routee.auth.repository.UserRepository;
import com.routee.folder.dto.FolderPlaceRequestDto;
import com.routee.folder.dto.FolderPlaceResponseDto;
import com.routee.folder.dto.FolderRequestDto;
import com.routee.folder.dto.FolderResponseDto;
import com.routee.folder.entity.Folder;
import com.routee.folder.entity.FolderPlace;
import com.routee.folder.repository.FolderPlaceRepository;
import com.routee.folder.repository.FolderRepository;
import com.routee.schedule.entity.Place;
import com.routee.schedule.repository.PlaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FolderService {

    private final FolderRepository folderRepository;
    private final FolderPlaceRepository folderPlaceRepository;
    private final UserRepository userRepository;
    private final PlaceRepository placeRepository;

    @Transactional
    public FolderResponseDto createFolder(Long userId, FolderRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        Folder folder = Folder.builder()
                .user(user)
                .folderName(request.getFolderName())
                .build();

        Folder saved = folderRepository.save(folder);
        int count = folderPlaceRepository.countByFolder_FolderId(saved.getFolderId());

        return FolderResponseDto.of(saved, count);
    }

    public List<FolderResponseDto> getFolders(Long userId) {
        List<Folder> folders = folderRepository.findByUser_UserId(userId);

        return folders.stream()
                .map(folder -> {
                    int count = folderPlaceRepository.countByFolder_FolderId(folder.getFolderId());
                    return FolderResponseDto.of(folder, count);
                })
                .collect(Collectors.toList());
    }

    public List<FolderPlaceResponseDto> getFolderPlaces(Long folderId, Long userId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 폴더입니다."));

        if (!folder.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }

        List<FolderPlace> folderPlaces = folderPlaceRepository.findByFolder_FolderId(folderId);

        return folderPlaces.stream()
                .map(fp -> FolderPlaceResponseDto.of(fp.getPlace()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteFolder(Long folderId, Long userId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 폴더입니다."));

        if (!folder.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }

        folderRepository.delete(folder);
    }

    @Transactional
    public FolderPlaceResponseDto addPlaceToFolder(Long folderId, Long userId, FolderPlaceRequestDto request) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 폴더입니다."));

        if (!folder.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }

        Place place = placeRepository.findById(request.getPlaceId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 장소입니다."));

        boolean alreadyExists = folderPlaceRepository
                .existsByFolder_FolderIdAndPlace_PlaceId(folderId, place.getPlaceId());
        if (alreadyExists) {
            throw new IllegalArgumentException("이미 폴더에 저장된 장소입니다.");
        }

        FolderPlace folderPlace = FolderPlace.builder()
                .folder(folder)
                .place(place)
                .build();

        folderPlaceRepository.save(folderPlace);

        return FolderPlaceResponseDto.of(place);
    }

    // ── 폴더에서 장소 삭제 ────────────────────────────────
    @Transactional
    public void removePlaceFromFolder(Long folderId, Long placeId, Long userId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 폴더입니다."));

        if (!folder.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("접근 권한이 없습니다.");
        }

        FolderPlace folderPlace = folderPlaceRepository
                .findByFolder_FolderIdAndPlace_PlaceId(folderId, placeId)
                .orElseThrow(() -> new IllegalArgumentException("폴더에 해당 장소가 없습니다."));

        folderPlaceRepository.delete(folderPlace);
    }
}
