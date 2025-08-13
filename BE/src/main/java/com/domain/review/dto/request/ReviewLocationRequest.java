package com.domain.review.dto.request;

import com.domain.review.validator.SeoulLocation;
import jakarta.validation.constraints.NotNull;

public record ReviewLocationRequest(
        @NotNull(message = "위도는 필수입니다")
        @SeoulLocation(type = SeoulLocation.LocationType.LATITUDE, message = "위도는 서울 지역 범위여야 합니다")
        Double latitude,

        @NotNull(message = "경도는 필수입니다")
        @SeoulLocation(type = SeoulLocation.LocationType.LONGITUDE, message = "경도는 서울 지역 범위여야 합니다")
        Double longitude
) {
}
