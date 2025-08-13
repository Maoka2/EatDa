package com.domain.review.dto.response;

import lombok.Builder;

@Builder
public record ReviewScrapResult(
        boolean isNewScrap,  // true: 새로 추가됨, false: 취소됨
        int scrapCount       // 현재 총 스크랩 수
) {}
