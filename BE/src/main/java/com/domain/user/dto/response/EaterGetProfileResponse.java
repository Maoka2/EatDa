package com.domain.user.dto.response;

public record EaterGetProfileResponse(
        Long countReview,
        Long countScrapReview,
        Long countMenuPost
) {
}
