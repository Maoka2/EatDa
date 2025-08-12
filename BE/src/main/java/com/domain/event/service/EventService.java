package com.domain.event.service;

import com.domain.event.dto.request.EventAssetCreateRequest;
import com.domain.event.dto.request.EventFinalizeRequest;
import com.domain.event.dto.response.ActiveStoreEventResponse;
import com.domain.event.dto.response.EventAssetRequestResponse;
import com.domain.event.dto.response.EventFinalizeResponse;
import com.domain.event.dto.response.MyEventResponse;
import com.global.dto.request.AssetCallbackRequest;
import com.global.dto.response.AssetResultResponse;
import java.util.List;
import org.springframework.core.io.Resource;

public interface EventService {

    EventAssetRequestResponse requestEventAsset(EventAssetCreateRequest request, String makerEmail);

    void handleEventAssetCallback(AssetCallbackRequest<?> request);

    AssetResultResponse getEventAssetStatus(Long assetId, String makerEmail);

    EventFinalizeResponse finalizeEvent(EventFinalizeRequest request);

    Resource downloadEventAsset(Long assetId, String makerEmail);

    List<MyEventResponse> getMyEvents(Long lastEventId, String makerEmail);

    List<ActiveStoreEventResponse> getActiveStoreEvents(Long storeId, Long lastEventId);

    void deleteEvent(Long eventId, String makerEmail);
}
