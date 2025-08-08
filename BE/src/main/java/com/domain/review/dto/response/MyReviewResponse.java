package com.domain.review.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record MyReviewResponse(
        Long reviewId,
        String storeName,
        String description,
        List<String> menuNames,
        String assetUrl,
        LocalDateTime createdAt
) {}
