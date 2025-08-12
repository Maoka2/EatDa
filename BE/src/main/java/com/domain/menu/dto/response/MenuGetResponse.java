package com.domain.menu.dto.response;

public record MenuGetResponse(
        String name,
        Integer price,
        String description,
        String imageUrl
) {
}
