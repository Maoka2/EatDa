package com.domain.review.dto.response;

import com.global.annotation.ExcludeFromLogging;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record MyReviewResponse(
        Long reviewId,
        String storeName,
        String description,
        List<String> menuNames,
        @ExcludeFromLogging
        String imageUrl,
        @ExcludeFromLogging
        String shortsUrl,
        @ExcludeFromLogging
        String thumbnailUrl,
        LocalDateTime createdAt
) {}
