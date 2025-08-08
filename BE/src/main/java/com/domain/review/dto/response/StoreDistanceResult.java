package com.domain.review.dto.response;

import lombok.Builder;

@Builder
public record StoreDistanceResult(
        Long storeId,    // 가게 ID
        int distance     // POI로부터의 거리 (미터 단위)
) {
}