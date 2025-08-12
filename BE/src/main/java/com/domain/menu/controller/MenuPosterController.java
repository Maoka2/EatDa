package com.domain.menu.controller;

import com.domain.menu.dto.request.AdoptMenuPostersRequest;
import com.domain.menu.dto.request.MenuPosterAssetCreateRequest;
import com.domain.menu.dto.request.MenuPosterFinalizeRequest;
import com.domain.menu.dto.request.SendMenuPosterRequest;
import com.domain.menu.dto.response.AdoptMenuPostersResponse;
import com.domain.menu.dto.response.MenuPosterAssetRequestResponse;
import com.domain.menu.dto.response.MenuPosterFinalizeResponse;
import com.domain.menu.service.MenuPosterService;
import com.global.constants.AssetType;
import com.global.constants.SuccessCode;
import com.global.dto.request.AssetCallbackRequest;
import com.global.dto.response.ApiResponseFactory;
import com.global.dto.response.AssetResultResponse;
import com.global.dto.response.BaseResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/menu-posters")
@RequiredArgsConstructor
public class MenuPosterController {

    private final MenuPosterService menuPosterService;

    @PostMapping(value = "/assets/request", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse> requestMenuPosterAsset(
            @Valid @ModelAttribute final MenuPosterAssetCreateRequest request,
            @AuthenticationPrincipal final String email
    ) {
        MenuPosterAssetRequestResponse response = menuPosterService.requestMenuPosterAsset(request, email);
        return ApiResponseFactory.success(SuccessCode.POSTER_REQUESTED, response);
    }

    @PostMapping("/assets/callback")
    public ResponseEntity<BaseResponse> handleMenuPosterAssetCallback(
            @Valid @RequestBody final AssetCallbackRequest<AssetType> request
    ) {
        menuPosterService.handleMenuPosterAssetCallback(request);
        return ApiResponseFactory.success(SuccessCode.POSTER_RECEIVED);
    }

    @GetMapping("/assets/{assetId}/result")
    public ResponseEntity<BaseResponse> getMenuPosterAssetResult(
            @PathVariable("assetId") final Long assetId,
            @AuthenticationPrincipal final String email
    ) {
        AssetResultResponse response = menuPosterService.getMenuPosterAssetStatus(assetId, email);

        // response에 assetUrl이 있으면 SUCCESS, 빈 문자열이면 PENDING
        SuccessCode successCode = !response.path().isEmpty()
                ? SuccessCode.POSTER_GENERATION_SUCCESS
                : SuccessCode.POSTER_GENERATION_PENDING;

        return ApiResponseFactory.success(successCode, response);
    }

    @PostMapping("/finalize")
    public ResponseEntity<BaseResponse> finalizeMenuPoster(
            @Valid @RequestBody final MenuPosterFinalizeRequest request
    ) {
        MenuPosterFinalizeResponse response = menuPosterService.finalizeMenuPoster(request);
        return ApiResponseFactory.success(SuccessCode.POSTER_FINALIZED, response);
    }

    @PostMapping("/send")
    public ResponseEntity<BaseResponse> sendMenuPosterToMaker(
            @Valid @RequestBody final SendMenuPosterRequest request,
            @AuthenticationPrincipal final String email
    ) {
        menuPosterService.sendMenuPosterToMaker(request.menuPosterId(), email);
        return ApiResponseFactory.success(SuccessCode.POSTER_SENT);
    }

    @PostMapping("/adopted")
    public ResponseEntity<BaseResponse> adoptMenuPosters(
            @Valid @RequestBody final AdoptMenuPostersRequest request,
            @AuthenticationPrincipal final String email
    ) {
        AdoptMenuPostersResponse response = menuPosterService.adoptMenuPosters(request, email);
        return ApiResponseFactory.success(SuccessCode.POSTERS_ADOPTED, response);
    }
}
