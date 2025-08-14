package com.domain.store.dto.response;

import java.util.List;

public record StoreNearbyResponse(
        List<StoreInfo> stores,
        int totalCount,
        int searchRadius,  // 실제 검색된 거리
        Location searchLocation  // 검색 기준 위치
) {
    public record Location(
            Double latitude,
            Double longitude
    ) {}

    // 편의 메서드
    public static StoreNearbyResponse of(List<StoreInfo> stores, int searchRadius,
                                         Double latitude, Double longitude) {
        return new StoreNearbyResponse(
                stores,
                stores.size(),
                searchRadius,
                new Location(latitude, longitude)
        );
    }
}
