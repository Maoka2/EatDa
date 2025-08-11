package com.domain.event.service.impl;

import com.domain.event.dto.redis.EventAssetGenerateMessage;
import com.domain.event.dto.request.EventAssetCreateRequest;
import com.domain.event.dto.request.EventFinalizeRequest;
import com.domain.event.dto.response.ActiveStoreEventResponse;
import com.domain.event.dto.response.EventAssetRequestResponse;
import com.domain.event.dto.response.EventFinalizeResponse;
import com.domain.event.dto.response.MyEventResponse;
import com.domain.event.entity.Event;
import com.domain.event.entity.EventAsset;
import com.domain.event.infrastructure.redis.EventAssetRedisPublisher;
import com.domain.event.repository.EventAssetRepository;
import com.domain.event.repository.EventRepository;
import com.domain.event.service.EventService;
import com.domain.event.validator.EventValidator;
import com.domain.user.repository.UserRepository;
import com.domain.store.entity.Store;
import com.domain.store.repository.StoreRepository;
import com.domain.user.entity.User;
import com.global.constants.AssetType;
import com.global.constants.ErrorCode;
import com.global.constants.PagingConstants;
import com.global.constants.Status;
import com.global.dto.request.AssetCallbackRequest;
import com.global.dto.response.AssetResultResponse;
import com.global.exception.ApiException;
import com.global.filestorage.FileStorageService;
import com.global.redis.constants.RedisStreamKey;
import com.global.utils.AssetValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final StoreRepository storeRepository;
    private final EventRepository eventRepository;
    private final EventAssetRepository eventAssetRepository;
    private final FileStorageService fileStorageService;
    private final EventAssetRedisPublisher eventAssetRedisPublisher;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public EventAssetRequestResponse requestEventAsset(EventAssetCreateRequest request, final String makerEmail) {
        // storeId 유효성 검사
        Store store = storeRepository.findById(request.storeId())
                        .orElseThrow(() -> new ApiException(ErrorCode.STORE_NOT_FOUND));

        // 사용자 ROLE 검사
        User maker = userRepository.findByEmailAndDeletedFalse(makerEmail)
                        .orElseThrow(() -> new ApiException(ErrorCode.FORBIDDEN));

        AssetValidator.validateImages(request.image(), ErrorCode.IMAGE_TOO_LARGE);

        LocalDate startDate = LocalDate.parse(request.startDate());
        LocalDate endDate = LocalDate.parse(request.endDate());

        EventValidator.validateDateRange(startDate, endDate);
        Event event = createPendingEvent(store, startDate, endDate);
        EventAsset eventAsset = createPendingEventAsset(event, request);

        List<String> uploadedImageUrls = uploadImages(request.image());
        EventAssetGenerateMessage message = EventAssetGenerateMessage.of(
                eventAsset.getId(),
                request.type(),
                request.prompt(),
                store.getId(),
                maker.getId(),
                request.title(),
                startDate,
                endDate,
                uploadedImageUrls
        );
        eventAssetRedisPublisher.publish(RedisStreamKey.EVENT_ASSET, message);

        return EventAssetRequestResponse.from(eventAsset);
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

    @Override
    @Transactional(readOnly = true)
    public AssetResultResponse getEventAssetStatus(Long assetId, String makerEmail) {
        User maker = userRepository.findByEmailAndDeletedFalse(makerEmail)
                .orElseThrow(() -> new ApiException(ErrorCode.FORBIDDEN));

        EventAsset asset = eventAssetRepository.findByIdWithStore(assetId)
                .orElseThrow(() -> new ApiException(ErrorCode.ASSET_NOT_FOUND, assetId));

        EventValidator.validateOwnership(maker, asset);

        return switch (asset.getStatus()) {
            case SUCCESS -> new AssetResultResponse(asset.getType(), asset.getAssetUrl());
            case PENDING -> new AssetResultResponse(asset.getType(), "");
            case FAIL -> throw new ApiException(ErrorCode.ASSET_URL_REQUIRED, assetId);
        };
    }

    @Override
    @Transactional
    public EventFinalizeResponse finalizeEvent(final EventFinalizeRequest request) {
        EventAsset asset = eventAssetRepository.findById(request.eventAssetId())
                .orElseThrow(() -> new ApiException(ErrorCode.ASSET_NOT_FOUND, request.eventAssetId()));

        EventValidator.validateForFinalization(asset);

        Event event = eventRepository.findById(request.eventId())
                .orElseThrow(() -> new ApiException(ErrorCode.EVENT_NOT_FOUND, request.eventId()));

        EventValidator.validatePendingStatus(event);

        event.updateDescription(request.description());
        event.updateStatus(Status.SUCCESS);
        asset.registerEvent(event);

        return EventFinalizeResponse.from(event);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource downloadEventAsset(Long assetId, String makerEmail) {
        User maker = userRepository.findByEmailAndDeletedFalse(makerEmail)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));

        EventAsset asset = eventAssetRepository.findByIdWithStore(assetId)
                .orElseThrow(() -> new ApiException(ErrorCode.ASSET_NOT_FOUND, assetId));

        EventValidator.validateOwnership(maker, asset);

        if (asset.getAssetUrl() == null || asset.getAssetUrl().isBlank()) {
            throw new ApiException(ErrorCode.ASSET_URL_REQUIRED, assetId);
        }

        try {
            Resource resource = fileStorageService.loadAsResource(asset.getAssetUrl());

            // 파일 존재 및 읽기 가능 여부 확인
            if (!resource.exists() || !resource.isReadable()) {
                throw new ApiException(ErrorCode.FILE_NOT_FOUND, asset.getAssetUrl());
            }

            return resource;
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("파일 다운로드 실패: eventAssetId={}, assetUrl={}", assetId, asset.getAssetUrl(), e);
            throw new ApiException(ErrorCode.FILE_DOWNLOAD_ERROR, e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<MyEventResponse> getMyEvents(Long lastEventId, String makerEmail) {
        User maker = userRepository.findByEmailAndDeletedFalse(makerEmail)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));

        List<Event> events = eventRepository.findMyEventsWithCursor(
                makerEmail,
                lastEventId,
                PageRequest.of(0, PagingConstants.DEFAULT_SIZE.value)
        );

        // EventAsset 조회 (N+1 문제 해결)
        List<Long> eventIds = events.stream()
                .map(Event::getId)
                .toList();

        Map<Long, EventAsset> assetMap = eventAssetRepository.findByEventIds(eventIds)
                .stream()
                .collect(Collectors.toMap(
                        ea -> ea.getEvent().getId(),
                        Function.identity()
                ));

        // Response 생성
        return events.stream()
                .map(event -> MyEventResponse.from(
                        event,
                        assetMap.get(event.getId())
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActiveStoreEventResponse> getActiveStoreEvents(Long storeId, Long lastEventId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new ApiException(ErrorCode.STORE_NOT_FOUND, storeId));

        LocalDate currentDate = LocalDate.now();
        List<Event> events = eventRepository.findActiveStoreEvents(
                storeId,
                currentDate,
                lastEventId,
                PageRequest.of(0, PagingConstants.DEFAULT_SIZE.value)
        );

        if (events.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> eventIds = events.stream()
                .map(Event::getId)
                .toList();

        Map<Long, EventAsset> assetMap = eventAssetRepository.findByEventIds(eventIds)
                .stream()
                .collect(Collectors.toMap(
                        ea -> ea.getEvent().getId(),
                        Function.identity()
                ));

        // Response 생성
        return events.stream()
                .map(event -> ActiveStoreEventResponse.from(
                        event,
                        assetMap.get(event.getId())
                ))
                .toList();
    }

    @Override
    public void deleteEvent(Long eventId, String makerEmail) {
        User maker = userRepository.findByEmailAndDeletedFalse(makerEmail)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));

        Event event = eventRepository.findByIdAndDeletedFalse(eventId)
                .orElseThrow(() -> new ApiException(ErrorCode.EVENT_NOT_FOUND, eventId));

        EventValidator.validateOwnership(maker, event);

        // 소프트 삭제
        event.delete();
        eventRepository.save(event);
    }

    private Event createPendingEvent(final Store store, final LocalDate startDate, final LocalDate endDate) {
        return eventRepository.save(Event.createPending(store, startDate, endDate));
    }

    private EventAsset createPendingEventAsset(final Event event, final EventAssetCreateRequest request) {
        return eventAssetRepository.save(EventAsset.createPending(event, AssetType.IMAGE, request.prompt()));
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
