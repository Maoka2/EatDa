package com.domain.event.controller;

import static com.global.constants.SuccessCode.ACTIVE_STORE_EVENTS_FETCHED;
import static com.global.constants.SuccessCode.ASSET_GENERATION_PENDING;
import static com.global.constants.SuccessCode.ASSET_GENERATION_SUCCESS;
import static com.global.constants.SuccessCode.EVENT_ASSET_RECEIVED;
import static com.global.constants.SuccessCode.EVENT_ASSET_REQUESTED;
import static com.global.constants.SuccessCode.EVENT_DELETED;
import static com.global.constants.SuccessCode.EVENT_LIST_RETRIEVED;
import static com.global.constants.SuccessCode.EVENT_REGISTERED;

import com.domain.event.dto.request.EventAssetCreateRequest;
import com.domain.event.dto.request.EventFinalizeRequest;
import com.domain.event.dto.response.ActiveStoreEventResponse;
import com.domain.event.dto.response.EventAssetRequestResponse;
import com.domain.event.dto.response.EventFinalizeResponse;
import com.domain.event.dto.response.MyEventResponse;
import com.domain.event.entity.Event;
import com.domain.event.mapper.EventMapper;
import com.domain.event.service.EventService;
import com.global.constants.AssetType;
import com.global.constants.SuccessCode;
import com.global.dto.request.AssetCallbackRequest;
import com.global.dto.response.ApiResponseFactory;
import com.global.dto.response.AssetResultResponse;
import com.global.dto.response.BaseResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final EventMapper eventMapper;

    @PostMapping(value = "/assets/request", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse> requestEventAsset(
            @Valid @ModelAttribute final EventAssetCreateRequest request,
            @AuthenticationPrincipal final String email
    ) {
        log.info("===== [Controller] requestEventAsset START =====");
        log.info("BaseRequest: title={}, type={}, startDate={}, endDate={}, prompt.length={}, imageCount={}",
                request.title(), request.type(), request.startDate(), request.endDate(),
                request.prompt() == null ? 0 : request.prompt().length(),
                request.image() != null ? request.image().size() : 0);
        log.info("makerEmail(principal): {}", email);

        EventAssetRequestResponse response = eventService.requestEventAsset(request, email);

        log.info("===== [Controller] requestEventAsset END =====");
        return ApiResponseFactory.success(EVENT_ASSET_REQUESTED, response);
    }

    @PostMapping("/assets/callback")
    public ResponseEntity<BaseResponse> handleEventAssetCallback(
            @Valid @RequestBody final AssetCallbackRequest<AssetType> request
    ) {
        eventService.handleEventAssetCallback(request);

        return ApiResponseFactory.success(EVENT_ASSET_RECEIVED);
    }

    @GetMapping("/assets/{eventAssetId}/result")
    public ResponseEntity<BaseResponse> getEventAssetResult(
            @PathVariable("eventAssetId") final Long eventAssetId,
            @AuthenticationPrincipal final String email
    ) {
        AssetResultResponse response = eventService.getEventAssetStatus(eventAssetId, email);

        // response에 assetUrl이 있으면 SUCCESS, 빈 문자열이면 PENDING
        SuccessCode successCode = !response.path().isEmpty()
                ? ASSET_GENERATION_SUCCESS
                : ASSET_GENERATION_PENDING;

        return ApiResponseFactory.success(successCode, response);
    }

    @PostMapping("/finalize")
    public ResponseEntity<BaseResponse> finalizeEvent(
            @Valid @RequestBody final EventFinalizeRequest request,
            @AuthenticationPrincipal final String email
    ) {
        EventFinalizeResponse response = eventService.finalizeEvent(request);

        return ApiResponseFactory.success(EVENT_REGISTERED, response);
    }

    @GetMapping("/assets/download")
    public ResponseEntity<Resource> downloadEventAsset(
            @RequestParam("eventAssetId") final Long eventAssetId,
            @AuthenticationPrincipal final String email
    ) {
        Resource resource = eventService.downloadEventAsset(eventAssetId, email);

        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("image/webp"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"event_" + eventAssetId + ".webp\"")
                .body(resource);
    }

    @GetMapping("/my")
    public ResponseEntity<BaseResponse> getMyEvents(
            @RequestParam(value = "lastEventId", required = false) final Long lastEventId,
            @AuthenticationPrincipal final String email
    ) {
        List<MyEventResponse> response = eventService.getMyEvents(lastEventId, email);

        return ApiResponseFactory.success(EVENT_LIST_RETRIEVED, response);
    }

    @GetMapping("/active")
    public ResponseEntity<BaseResponse> getActiveEvents(
            @RequestParam(value = "lastEventId", required = false) final Long lastEventId
    ) {
        List<ActiveStoreEventResponse> response = eventService.getActiveEvents(lastEventId);

        return ApiResponseFactory.success(ACTIVE_STORE_EVENTS_FETCHED, response);
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<BaseResponse> deleteEvent(
            @PathVariable("eventId") final Long eventId,
            @AuthenticationPrincipal final String email
    ) {
        eventService.deleteEvent(eventId, email);

        return ApiResponseFactory.success(EVENT_DELETED);
    }

    @GetMapping
    public ResponseEntity<BaseResponse> getEvents(@RequestParam("storeId") final Long storeId) {
        List<Event> events = eventService.getEvents(storeId);
        return ApiResponseFactory.success(EVENT_LIST_RETRIEVED, eventMapper.toResponse(events));
    }
}
