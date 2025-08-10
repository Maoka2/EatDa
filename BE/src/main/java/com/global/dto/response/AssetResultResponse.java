package com.global.dto.response;

import com.global.constants.AssetType;
import com.global.entity.BaseAssetEntity;

public record AssetResultResponse(
        AssetType type,
        String assetUrl
) {
    public static AssetResultResponse from(BaseAssetEntity asset) {
        String url = asset.getAssetUrl() != null ? asset.getAssetUrl() : "";
        return new AssetResultResponse(asset.getType(), url);
    }
}
