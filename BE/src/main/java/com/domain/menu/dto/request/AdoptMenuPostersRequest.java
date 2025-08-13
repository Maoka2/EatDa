package com.domain.menu.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AdoptMenuPostersRequest(
        @NotNull(message = "STORE_ID_REQUIRED")
        Long storeId,

        @NotEmpty(message = "MENU_POSTER_IDS_REQUIRED")
        @Size(max = 5, message = "MENU_POSTER_IDS_EXCEED_LIMIT")
        List<@NotNull Long> menuPosterIds
) {
}
