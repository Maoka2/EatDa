package com.domain.review.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record ReviewFeedRequest (
        @NotNull(message = "위도는 필수입니다")
        @Min(value = -90, message = "위도는 -90 이상이어야 합니다")
        @Max(value = 90, message = "위도는 90 이하여야 합니다")
        Double latitude,

        @NotNull(message = "경도는 필수입니다")
        @Min(value = -180, message = "경도는 -180 이상이어야 합니다")
        @Max(value = 180, message = "경도는 180 이하여야 합니다")
        Double longitude,

//        @AllowedDistance
        Integer distance,

        Long lastReviewId
) {
    // 기본값 처리를 위한 생성자
    public ReviewFeedRequest {
        if (distance == null) {
            distance = 500;
        }
    }
}
