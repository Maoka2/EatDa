package com.domain.review.dto.response;

import lombok.Builder;

@Builder
public record MyReceivedResponse(
        String description,
        String imageUrl,
        String shortsUrl,
        String thumbnailUrl
) {
}
