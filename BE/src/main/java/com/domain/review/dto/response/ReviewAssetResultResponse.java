package com.domain.review.dto.response;

import com.domain.review.constants.ReviewAssetType;
import com.global.annotation.ExcludeFromLogging;

public record ReviewAssetResultResponse(
        ReviewAssetType type,

        @ExcludeFromLogging
        String imageUrl,

        @ExcludeFromLogging
        String shortsUrl,

        @ExcludeFromLogging
        String thumbnailUrl
){
}
