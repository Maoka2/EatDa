package com.domain.review.service;

import com.domain.review.dto.response.ReviewScrapResult;

public interface ReviewScrapService {
    ReviewScrapResult toggleScrap(Long reviewId, String eaterEmail);
}
