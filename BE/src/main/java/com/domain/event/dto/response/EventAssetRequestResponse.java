package com.domain.event.dto.response;

import com.domain.event.entity.Event;
import com.domain.event.entity.EventAsset;

public record EventAssetRequestResponse(
        Long eventId,
        Long eventAssetId
) {
    public static EventAssetRequestResponse from(Event event, EventAsset asset) {
        return new EventAssetRequestResponse(event.getId(), asset.getId());
    }
}
