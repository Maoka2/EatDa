package com.domain.menu.service;

import com.domain.menu.dto.request.AdoptMenuPostersRequest;
import com.domain.menu.dto.request.MenuPosterAssetCreateRequest;
import com.domain.menu.dto.request.MenuPosterFinalizeRequest;
import com.domain.menu.dto.response.AdoptMenuPostersResponse;
import com.domain.menu.dto.response.MenuPosterAssetRequestResponse;
import com.domain.menu.dto.response.MenuPosterFinalizeResponse;
import com.domain.menu.entity.MenuPoster;
import com.global.dto.request.AssetCallbackRequest;
import com.global.dto.response.AssetResultResponse;
import java.util.List;

public interface MenuPosterService {

    MenuPosterAssetRequestResponse requestMenuPosterAsset(final MenuPosterAssetCreateRequest request,
                                                          final String eaterMail);

    void handleMenuPosterAssetCallback(final AssetCallbackRequest<?> request);

    AssetResultResponse getMenuPosterAssetStatus(final Long assetId, final String eaterMail);

    MenuPosterFinalizeResponse finalizeMenuPoster(final MenuPosterFinalizeRequest request);

    void sendMenuPosterToMaker(final Long menuPosterId, final String eaterEmail);

    AdoptMenuPostersResponse adoptMenuPosters(final AdoptMenuPostersRequest request, final String makerEmail);

    List<MenuPoster> getMyMenuPosters(String email);

    List<MenuPoster> getReceivedMenuPosters(String email);
}
