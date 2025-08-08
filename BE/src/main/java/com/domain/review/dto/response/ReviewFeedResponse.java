package com.domain.review.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

import java.util.List;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReviewFeedResponse(
        Long reviewId,
        String storeName,
        String description,
        List<String> menuNames,
        String assetUrl,
        Integer distance  // 전체 피드의 경우 null
) {
}
