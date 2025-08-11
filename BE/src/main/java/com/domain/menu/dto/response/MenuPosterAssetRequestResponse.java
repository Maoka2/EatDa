package com.domain.menu.dto.response;

import com.domain.menu.entity.MenuPosterAsset;

public record MenuPosterAssetRequestResponse(
        Long menuPosterId
) {
    public static MenuPosterAssetRequestResponse from(MenuPosterAsset asset) {
        return new MenuPosterAssetRequestResponse(asset.getId());
    }
}
