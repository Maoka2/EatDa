package com.domain.menu.dto.response;

import java.util.List;

public record AdoptMenuPostersResponse(
        Long storeId,
        List<Long> adoptedMenuPosterIds
) {
    public static AdoptMenuPostersResponse of(Long storeId, List<Long> menuPosterIds) {
        return new AdoptMenuPostersResponse(storeId, menuPosterIds);
    }
}
