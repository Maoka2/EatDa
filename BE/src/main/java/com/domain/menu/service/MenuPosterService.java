package com.domain.menu.service;

import com.domain.menu.dto.request.AdoptMenuPostersRequest;
import com.domain.menu.dto.request.MenuPosterAssetCreateRequest;
import com.domain.menu.dto.request.MenuPosterFinalizeRequest;
import com.domain.menu.dto.response.AdoptMenuPostersResponse;
import com.domain.menu.dto.response.MenuPosterAssetRequestResponse;
import com.domain.menu.dto.response.MenuPosterFinalizeResponse;
import com.global.dto.request.AssetCallbackRequest;
import com.global.dto.response.AssetResultResponse;

public interface MenuPosterService {

    MenuPosterAssetRequestResponse requestMenuPosterAsset(MenuPosterAssetCreateRequest request, String eaterMail);
    void handleMenuPosterAssetCallback(AssetCallbackRequest<?> request);
    AssetResultResponse getMenuPosterAssetStatus(Long assetId, String eaterMail);
    MenuPosterFinalizeResponse finalizeMenuPoster(MenuPosterFinalizeRequest request);
    void sendMenuPosterToMaker(Long menuPosterId, String eaterEmail);
    AdoptMenuPostersResponse adoptMenuPosters(AdoptMenuPostersRequest request, String makerEmail);
}
