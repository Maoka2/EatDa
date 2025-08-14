package com.domain.review.dto.response;

import lombok.Builder;

@Builder
public record MyScrapResponse(
        String storeName,
        String description,
        String imageUrl,
        String shortsUrl,
        String thumbnailUrl
) {
}
