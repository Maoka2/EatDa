package com.domain.menu.dto.response;

import com.global.annotation.ExcludeFromLogging;

public record MenuPosterGetResponse(
        Long id,
        @ExcludeFromLogging
        String imageUrl
) {
}
