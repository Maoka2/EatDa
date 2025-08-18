package com.domain.menu.dto.request;

import jakarta.validation.constraints.NotNull;

public record ReleaseMenuPosterRequest(
        @NotNull(message = "STORE_ID_REQUIRED")
        Long storeId,

        @NotNull(message = "MENU_POSTER_ID_REQUIRED")
        Long menuPosterId
) {
}
