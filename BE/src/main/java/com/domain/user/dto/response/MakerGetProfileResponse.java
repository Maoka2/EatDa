package com.domain.user.dto.response;

public record MakerGetProfileResponse(
        Long countReceivedReviews,
        Long countEvents,
        Long countMenuPosters
) {
}
