package com.domain.user.dto.response;

import lombok.Builder;

@Builder
public record MakerGetProfileResponse(
        Long storeId,
        String storeName,
        Long countReceivedReviews,
        Long countEvents,
        Long countMenuPosters
) {
}
