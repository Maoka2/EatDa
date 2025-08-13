package com.global.dto.response;

import com.global.constants.AssetType;
import com.global.entity.BaseAssetEntity;

public record AssetResultResponse(
        AssetType type,
        String path
) {
    public static AssetResultResponse from(BaseAssetEntity asset) {
        String url = asset.getPath() != null ? asset.getPath() : "";
        return new AssetResultResponse(asset.getType(), url);
    }
}
