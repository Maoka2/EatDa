package com.domain.event.service.impl;

import com.domain.event.dto.redis.EventAssetGenerateMessage;
import com.domain.event.dto.request.EventAssetCreateRequest;
import com.domain.event.dto.response.EventAssetRequestResponse;
import com.domain.event.entity.Event;
import com.domain.event.entity.EventAsset;
import com.domain.event.infrastructure.redis.EventAssetRedisPublisher;
import com.domain.event.mapper.EventAssetRepository;
import com.domain.event.mapper.EventMapper;
import com.domain.event.repository.EventRepository;
import com.domain.event.service.EventService;
import com.domain.store.entity.Store;
import com.domain.store.repository.StoreRepository;
import com.global.constants.AssetType;
import com.global.constants.ErrorCode;
import com.global.constants.Status;
import com.global.dto.request.AssetCallbackRequest;
import com.global.exception.ApiException;
import com.global.filestorage.FileStorageService;
import com.global.redis.constants.RedisStreamKey;
import com.global.utils.AssetValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final StoreRepository storeRepository;
    private final EventRepository eventRepository;
    private final EventAssetRepository eventAssetRepository;
    private final EventMapper eventMapper;
    private final FileStorageService fileStorageService;
    private final EventAssetRedisPublisher eventAssetRedisPublisher;

    @Override
    @Transactional
    public EventAssetRequestResponse requestEventAsset(EventAssetCreateRequest request, final Long userId) {
        // storeId 유효성 검사
        Store store = storeRepository.findById(request.storeId())
                        .orElseThrow(() -> new ApiException(ErrorCode.STORE_NOT_FOUND));

        AssetValidator.validateImages(request.image(), ErrorCode.IMAGE_TOO_LARGE);

        LocalDate startDate = LocalDate.parse(request.startDate());
        LocalDate endDate = LocalDate.parse(request.endDate());

        Event event = createPendingEvent(store, startDate, endDate);
        EventAsset eventAsset = createPendingEventAsset(event, request);

        List<String> uploadedImageUrls = uploadImages(request.image());
        EventAssetGenerateMessage message = EventAssetGenerateMessage.of(
                eventAsset.getId(),
                request.type(),
                request.prompt(),
                store.getId(),
                userId,
                request.title(),
                startDate,
                endDate,
                uploadedImageUrls
        );
        eventAssetRedisPublisher.publish(RedisStreamKey.EVENT_ASSET, message);

        return eventMapper.toRequestResponse(eventAsset);
    }

    @Override
    @Transactional
    public void handleEventAssetCallback(AssetCallbackRequest<?> request) {
        EventAsset asset = eventAssetRepository.findById(request.assetId())
                .orElseThrow(() -> new ApiException(ErrorCode.ASSET_NOT_FOUND));

        AssetValidator.validateCallbackRequest(asset, request);
        Status status = Status.fromString(request.result());
        asset.processCallback(status, request.assetUrl());
    }


    private Event createPendingEvent(final Store store, final LocalDate startDate, final LocalDate endDate) {
        return eventRepository.save(eventMapper.toPendingEvent(store, startDate, endDate));
    }

    private EventAsset createPendingEventAsset(final Event event, final EventAssetCreateRequest request) {
        EventAsset asset = eventMapper.toPendingEventAsset(event, AssetType.IMAGE, request);
        return eventAssetRepository.save(asset);
    }

    private List<String> uploadImages(final List<MultipartFile> images) {
        return images.stream()
                .map(file -> fileStorageService.storeImage(
                        file,
                        "events",
                        file.getOriginalFilename()
                ))
                .toList();
    }
}
