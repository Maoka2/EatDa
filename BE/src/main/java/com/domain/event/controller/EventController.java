package com.domain.event.controller;

import com.domain.event.dto.request.EventAssetCreateRequest;
import com.domain.event.dto.request.EventFinalizeRequest;
import com.domain.event.dto.response.ActiveStoreEventResponse;
import com.domain.event.dto.response.EventAssetRequestResponse;
import com.domain.event.dto.response.EventFinalizeResponse;
import com.domain.event.dto.response.MyEventResponse;
import com.domain.event.service.EventService;
import com.global.constants.AssetType;
import com.global.constants.SuccessCode;
import com.global.dto.request.AssetCallbackRequest;
import com.global.dto.response.ApiResponseFactory;
import com.global.dto.response.AssetResultResponse;
import com.global.dto.response.BaseResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.global.constants.SuccessCode.*;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping(value = "/assets/request", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse> requestEventAsset(
            @Valid @ModelAttribute final EventAssetCreateRequest request,
            @AuthenticationPrincipal final String email
            ) {
        EventAssetRequestResponse response = eventService.requestEventAsset(request, email);
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

    @GetMapping("/store/active")
    public ResponseEntity<BaseResponse> getActiveStoreEvents(
            @RequestParam("storeId") final Long storeId,
            @RequestParam(value = "lastEventId", required = false) final Long lastEventId
    ) {
        List<ActiveStoreEventResponse> response = eventService.getActiveStoreEvents(storeId, lastEventId);

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
}
