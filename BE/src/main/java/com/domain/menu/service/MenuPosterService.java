package com.domain.menu.service;

import com.domain.menu.dto.request.MenuPosterAssetCreateRequest;
import com.domain.menu.dto.response.MenuPosterAssetRequestResponse;
import com.global.dto.request.AssetCallbackRequest;

public interface MenuPosterService {

    MenuPosterAssetRequestResponse requestMenuPosterAsset(final MenuPosterAssetCreateRequest request, final String eaterMail);
    void handleMenuPosterAssetCallback(final AssetCallbackRequest<?> request);
}
