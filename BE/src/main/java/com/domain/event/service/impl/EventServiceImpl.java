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
import com.domain.store.entity.Store;
import com.domain.store.repository.StoreRepository;
import com.domain.user.entity.User;
import com.domain.user.repository.MakerRepository;
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
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private static final String IMAGE_BASE_PATH = "events/";

    private final StoreRepository storeRepository;
    private final EventRepository eventRepository;
    private final EventAssetRepository eventAssetRepository;
    private final FileStorageService fileStorageService;
    private final EventAssetRedisPublisher eventAssetRedisPublisher;
    private final MakerRepository makerRepository;

    @Override
    @Transactional
    public EventAssetRequestResponse requestEventAsset(final EventAssetCreateRequest request,
                                                       final String makerEmail) {

        log.info("===== [Service] requestEventAsset START =====");

        log.info("Step1: Find maker by email={}", makerEmail);
        User maker = makerRepository.findByEmailAndDeletedFalse(makerEmail)
                .orElseThrow(() -> {
                    log.warn("Step1-ERROR: maker not found or deleted");
                    return new ApiException(ErrorCode.FORBIDDEN);
                });
        log.info("Step1: OK - makerId={}", maker.getId());

        // Step2: 매장 선택
        log.info("Step2: Get first store from maker");
        Store store = maker.getStores().getFirst();
        log.info("Step2: OK - storeId={}", store.getId());

        // Step3: 이미지 유효성 검사
        log.info("Step3: Validate images - count={}", request.image() != null ? request.image().size() : 0);
        AssetValidator.validateImages(request.image(), ErrorCode.IMAGE_TOO_LARGE);
        log.info("Step3: OK");

        // Step4: 날짜 파싱
        log.info("Step4: Parse dates - start={}, end={}", request.startDate(), request.endDate());
        LocalDate startDate = LocalDate.parse(request.startDate());
        LocalDate endDate = LocalDate.parse(request.endDate());
        log.info("Step4: OK");

        // Step5: 날짜 범위 검증
        log.info("Step5: Validate date range");
        EventValidator.validateDateRange(startDate, endDate);
        log.info("Step5: OK");

        // Step6: 이벤트 생성
        log.info("Step6: Create pending event");
        Event event = createPendingEvent(request.title(), store, startDate, endDate);
        log.info("Step6: OK - eventId={}", event.getId());

        // Step7: 이벤트 에셋 생성
        log.info("Step7: Create pending event asset");
        EventAsset eventAsset = createPendingEventAsset(event, request);
        log.info("Step7: OK - eventAssetId={}", eventAsset.getId());

        // Step8: WEBP 변환 여부 결정
        log.info("Step8: Determine if images should convert to WEBP");
        boolean convertToWebp = shouldConvertToWebp(request.type());
        log.info("Step8: OK - convertToWebp={}", convertToWebp);

        // Step9: 이미지 업로드
        log.info("Step9: Upload images to path={}", IMAGE_BASE_PATH + maker.getEmail());
        List<String> uploadedImageUrls = uploadImages(request.image(), IMAGE_BASE_PATH + maker.getEmail(),
                convertToWebp);
        log.info("Step9: OK - uploadedImageCount={}", uploadedImageUrls.size());

        // Step10: 메시지 생성
        log.info("Step10: Create EventAssetGenerateMessage");
        EventAssetGenerateMessage message = EventAssetGenerateMessage.of(
                eventAsset.getId(),
                AssetType.IMAGE,
                request.prompt(),
                store.getId(),
                maker.getId(),
                request.title(),
                startDate,
                endDate,
                uploadedImageUrls
        );
        log.info("Step10: OK");

        // Step11: 메시지 발행
        log.info("Step11: Publish message to Redis stream={}", RedisStreamKey.EVENT_ASSET);
        eventAssetRedisPublisher.publish(RedisStreamKey.EVENT_ASSET, message);
        log.info("Step11: OK");

        log.info("===== [Service] requestEventAsset END =====");
        return EventAssetRequestResponse.from(event, eventAsset);
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
        User maker = makerRepository.findByEmailAndDeletedFalse(makerEmail)
                .orElseThrow(() -> new ApiException(ErrorCode.FORBIDDEN));

        EventAsset asset = eventAssetRepository.findByIdWithStore(assetId)
                .orElseThrow(() -> new ApiException(ErrorCode.ASSET_NOT_FOUND, assetId));

        EventValidator.validateOwnership(maker, asset);

        return switch (asset.getStatus()) {
            case SUCCESS -> new AssetResultResponse(asset.getType(), asset.getPath());
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
        User maker = makerRepository.findByEmailAndDeletedFalse(makerEmail)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));

        EventAsset asset = eventAssetRepository.findByIdWithStore(assetId)
                .orElseThrow(() -> new ApiException(ErrorCode.ASSET_NOT_FOUND, assetId));

        EventValidator.validateOwnership(maker, asset);

        if (asset.getPath() == null || asset.getPath().isBlank()) {
            throw new ApiException(ErrorCode.ASSET_URL_REQUIRED, assetId);
        }

        try {
            Resource resource = fileStorageService.loadAsResource(asset.getPath());

            // 파일 존재 및 읽기 가능 여부 확인
            if (!resource.exists() || !resource.isReadable()) {
                throw new ApiException(ErrorCode.FILE_NOT_FOUND, asset.getPath());
            }

            return resource;
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("파일 다운로드 실패: eventAssetId={}, assetUrl={}", assetId, asset.getPath(), e);
            throw new ApiException(ErrorCode.FILE_DOWNLOAD_ERROR, e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<MyEventResponse> getMyEvents(Long lastEventId, String makerEmail) {
        User maker = makerRepository.findByEmailAndDeletedFalse(makerEmail)
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
    public List<ActiveStoreEventResponse> getActiveEvents(Long lastEventId) {
        LocalDate currentDate = LocalDate.now();
        List<Event> events = eventRepository.findActiveEvents(
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
                        Function.identity(),
                        (existing, replacement) -> existing  // 중복 키 처리 추가
                ));

        // Response 생성
        return events.stream()
                .map(event -> ActiveStoreEventResponse.from(
                        event,
                        assetMap.get(event.getId())  // null일 수 있음을 고려
                ))
                .toList();
    }

    @Override
    public void deleteEvent(Long eventId, String makerEmail) {
        User maker = makerRepository.findByEmailAndDeletedFalse(makerEmail)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));

        Event event = eventRepository.findByIdAndDeletedFalse(eventId)
                .orElseThrow(() -> new ApiException(ErrorCode.EVENT_NOT_FOUND, eventId));

        EventValidator.validateOwnership(maker, event);

        // 소프트 삭제
        event.delete();
        eventRepository.save(event);
    }

    private Event createPendingEvent(final String title, final Store store, final LocalDate startDate,
                                     final LocalDate endDate) {
        return eventRepository.save(Event.createPending(title, store, startDate, endDate));
    }

    private EventAsset createPendingEventAsset(final Event event, final EventAssetCreateRequest request) {
        return eventAssetRepository.save(EventAsset.createPending(event, AssetType.IMAGE, request.prompt()));
    }

    private List<String> uploadImages(final List<MultipartFile> images, final String relativeBase,
                                      final boolean convertToWebp) {
        return images.stream()
                .map(file -> fileStorageService.storeImage(
                        file,
                        relativeBase,
                        file.getOriginalFilename(),
                        convertToWebp
                ))
                .toList();
    }

    private boolean shouldConvertToWebp(String type) {
        return AssetType.IMAGE.name().equals(type);
    }
}
