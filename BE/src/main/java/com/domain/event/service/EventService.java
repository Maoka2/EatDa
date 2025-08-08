package com.domain.event.service;

import com.domain.event.dto.request.EventAssetCreateRequest;
import com.domain.event.dto.response.EventAssetRequestResponse;

public interface EventService {

    EventAssetRequestResponse requestEventAsset(final EventAssetCreateRequest request);
}
