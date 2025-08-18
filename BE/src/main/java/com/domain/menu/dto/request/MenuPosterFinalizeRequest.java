package com.domain.menu.dto.request;

import com.global.constants.AssetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MenuPosterFinalizeRequest(

        @NotNull(message = "MENU_POSTER_ID_REQUIRED")
        Long menuPosterId,

        @NotBlank(message = "DESCRIPTION_REQUIRED")
        @Size(min = 30, message = "DESCRIPTION_TOO_SHORT")
        String description,

        @NotNull(message = "TYPE_REQUIRED")
        AssetType type
) {
}
