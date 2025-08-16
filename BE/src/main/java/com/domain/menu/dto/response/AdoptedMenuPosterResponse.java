package com.domain.menu.dto.response;

import lombok.Builder;

@Builder
public record AdoptedMenuPosterResponse(
        Long menuPosterId,
        String imageUrl
) {}