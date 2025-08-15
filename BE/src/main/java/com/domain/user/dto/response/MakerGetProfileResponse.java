package com.domain.user.dto.response;

public record MakerGetProfileResponse(
        String storeName,
        Long countReceivedReviews,
        Long countEvents,
        Long countMenuPosters
) {
}
