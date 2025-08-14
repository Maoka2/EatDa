package com.domain.store.dto.request;

import com.global.utils.geo.validation.SeoulLocation;
import jakarta.validation.constraints.NotNull;

public record StoreNearbyRequest(

        @NotNull(message = "LATITUDE_REQUIRED")
        @SeoulLocation(type = SeoulLocation.LocationType.LATITUDE, message = "위도는 서울 지역 범위여야 합니다")
        Double latitude,

        @NotNull(message = "LONGITUDE_REQUIRED")
        @SeoulLocation(type = SeoulLocation.LocationType.LONGITUDE, message = "경도는 서울 지역 범위여야 합니다")
        Double longitude,

        Integer distance
) {
}
