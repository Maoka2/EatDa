package com.domain.menu.dto.request;

import jakarta.validation.constraints.NotNull;

public record SendMenuPosterRequest(
        @NotNull(message = "MENU_POSTER_ID_REQUIRED")
        Long menuPosterId
) {
}
