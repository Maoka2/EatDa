package com.domain.review.dto.response;

import com.global.annotation.ExcludeFromLogging;
import lombok.Builder;
import java.time.LocalDateTime;
import java.util.List;

@Builder
public record ReviewDetailResponse(
        Long reviewId,
        StoreInfo store,
        UserInfo user,
        String description,
        List<String> menuNames,
        AssetInfo asset,
        int scrapCount,
        boolean isScrapped,
        LocalDateTime createdAt
) {

    @Builder
    public record StoreInfo(
            Long storeId,
            String storeName,
            String address,
            Double latitude,
            Double longitude
    ) {}

    @Builder
    public record UserInfo(
            Long userId,
            String nickname
    ) {}

    @Builder
    public record AssetInfo(
            String type,  // "IMAGE", "SHORTS_RAY_2", "SHORTS_GEN_4 등
            @ExcludeFromLogging
            String imageUrl,
            @ExcludeFromLogging
            String shortsUrl,
            @ExcludeFromLogging
            String thumbnailUrl
    ) {}
}
