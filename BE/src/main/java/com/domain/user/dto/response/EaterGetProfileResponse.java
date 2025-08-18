package com.domain.user.dto.response;

public record EaterGetProfileResponse(
        String nickname,
        Long countReview,
        Long countScrapReview,
        Long countMenuPost
) {
}
