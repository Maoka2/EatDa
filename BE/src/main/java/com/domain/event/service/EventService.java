package com.domain.event.service;

import com.domain.event.dto.request.EventAssetCreateRequest;
import com.domain.event.dto.request.EventFinalizeRequest;
import com.domain.event.dto.response.ActiveStoreEventResponse;
import com.domain.event.dto.response.EventAssetRequestResponse;
import com.domain.event.dto.response.EventFinalizeResponse;
import com.domain.event.dto.response.MyEventResponse;
import com.global.dto.request.AssetCallbackRequest;
import com.global.dto.response.AssetResultResponse;
import org.springframework.core.io.Resource;

import java.util.List;

public interface EventService {

    EventAssetRequestResponse requestEventAsset(final EventAssetCreateRequest request, final String makerEmail);
    void handleEventAssetCallback(final AssetCallbackRequest<?> request);
    AssetResultResponse getEventAssetStatus(final Long assetId, final String makerEmail);
    EventFinalizeResponse finalizeEvent(final EventFinalizeRequest request);
    Resource downloadEventAsset(final Long assetId, final String makerEmail);
    List<MyEventResponse> getMyEvents(final Long lastEventId, final String makerEmail);
    List<ActiveStoreEventResponse> getActiveStoreEvents(final Long storeId, final Long lastEventId);
    void deleteEvent(final Long eventId, final String makerEmail);
}
