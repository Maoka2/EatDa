package com.domain.menu.dto.response;

import com.domain.menu.entity.MenuPoster;

public record MenuPosterFinalizeResponse(
        Long menuPosterId
) {
    public static MenuPosterFinalizeResponse from(MenuPoster menuPoster) {
        return new MenuPosterFinalizeResponse(menuPoster.getId());
    }
}
