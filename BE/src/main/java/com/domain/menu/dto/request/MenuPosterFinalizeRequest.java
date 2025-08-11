package com.domain.menu.dto.request;

import com.global.constants.AssetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MenuPosterFinalizeRequest(

        @NotNull(message = "MENU_POSTER_ID_REQUIRED")
        Long menuPosterId,

        @NotNull(message = "MENU_POSTER_ASSET_ID_REQUIRED")
        Long menuPosterAssetId,

        @NotBlank(message = "DESCRIPTION_REQUIRED")
        String description,

        @NotNull(message = "TYPE_REQUIRED")
        AssetType type
) {
}
