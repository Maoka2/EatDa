package com.domain.menu.dto.response;

import jakarta.validation.constraints.NotNull;

public record ReleaseMenuPosterResponse(
        @NotNull(message = "STORE_ID_REQUIRED")
        Long storeId,

        @NotNull(message = "MENU_POSTER_ID_REQUIRED")
        Long menuPosterId
) {
}
