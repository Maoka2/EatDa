package com.domain.menu.dto.response;

import com.global.annotation.ExcludeFromLogging;

public record MenuGetResponse(
        String name,
        Integer price,
        String description,
        @ExcludeFromLogging
        String imageUrl
) {
}
