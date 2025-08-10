package com.domain.event.dto.response;

import com.domain.event.entity.EventAsset;

public record EventAssetRequestResponse(
        Long eventAssetId
) {
    public static EventAssetRequestResponse from(EventAsset asset) {
        return new EventAssetRequestResponse(asset.getId());
    }
}
