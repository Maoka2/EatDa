package com.domain.event.service;

import com.domain.event.dto.request.EventAssetCreateRequest;
import com.domain.event.dto.request.EventFinalizeRequest;
import com.domain.event.dto.response.EventAssetRequestResponse;
import com.domain.event.dto.response.EventFinalizeResponse;
import com.global.dto.request.AssetCallbackRequest;
import com.global.dto.response.AssetResultResponse;

public interface EventService {

    EventAssetRequestResponse requestEventAsset(final EventAssetCreateRequest request, final Long userId);
    void handleEventAssetCallback(final AssetCallbackRequest<?> request);
    AssetResultResponse getEventAssetStatus(final Long assetId, final Long userId);
    EventFinalizeResponse finalizeEvent(final EventFinalizeRequest request);
}
