package com.domain.event.service.impl;

import com.domain.event.dto.redis.EventAssetGenerateMessage;
import com.domain.event.dto.request.EventAssetCreateRequest;
import com.domain.event.dto.request.EventFinalizeRequest;
import com.domain.event.dto.response.EventAssetRequestResponse;
import com.domain.event.dto.response.EventFinalizeResponse;
import com.domain.event.dto.response.MyEventResponse;
import com.domain.event.entity.Event;
import com.domain.event.entity.EventAsset;
import com.domain.event.infrastructure.redis.EventAssetRedisPublisher;
import com.domain.event.repository.EventAssetRepository;
import com.domain.event.repository.EventRepository;
import com.domain.event.service.EventService;
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
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
    public AssetResultResponse getEventAssetStatus(Long assetId, Long userId) {
        EventAsset asset = eventAssetRepository.findByIdWithStore(assetId)
                .orElseThrow(() -> new ApiException(ErrorCode.ASSET_NOT_FOUND, assetId));

        if (!asset.getEvent().getStore().getMaker().getId().equals(userId)) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }

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

        if (!asset.getStatus().isSuccess()) {
            throw new ApiException(ErrorCode.ASSET_NOT_SUCCESS, asset.getId());
        }

        if (!Objects.equals(request.type(), AssetType.IMAGE)) {
            throw new ApiException(ErrorCode.ASSET_TYPE_MISMATCH, request.type());
        }

        Event event = eventRepository.findById(request.eventId())
                .orElseThrow(() -> new ApiException(ErrorCode.EVENT_NOT_FOUND, request.eventId()));

        if (!event.getStatus().isPending()) {
            throw new ApiException(ErrorCode.EVENT_NOT_PENDING, event.getId());
        }

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

        if (!asset.getEvent().getStore().getMaker().getId().equals(maker.getId())) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }

        if (asset.getAssetUrl() == null || asset.getAssetUrl().isBlank()) {
            throw new ApiException(ErrorCode.ASSET_URL_REQUIRED, assetId);
        }

        try {
            Resource resource = fileStorageService.loadAsResource(asset.getAssetUrl());

            // 6. 파일 존재 및 읽기 가능 여부 확인
            if (!resource.exists() || !resource.isReadable()) {
                throw new ApiException(ErrorCode.FILE_NOT_FOUND, asset.getAssetUrl());
            }

            return resource;
        } catch (Exception e) {
            log.error("파일 다운로드 실패: eventAssetId={}, assetUrl={}", assetId, asset.getAssetUrl(), e);
            throw new ApiException(ErrorCode.FILE_DOWNLOAD_ERROR, e.getMessage());
        }
    }

    @Override
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
