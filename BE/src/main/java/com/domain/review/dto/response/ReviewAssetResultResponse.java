package com.domain.review.dto.response;

import com.domain.review.constants.ReviewAssetType;

public record ReviewAssetResultResponse(
        ReviewAssetType type,
        String assetUrl
) {
}
