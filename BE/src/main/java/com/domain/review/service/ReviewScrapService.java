package com.domain.review.service;

import com.domain.review.dto.response.ReviewScrapResult;
import com.domain.review.entity.Review;
import java.util.List;

public interface ReviewScrapService {
    ReviewScrapResult toggleScrap(Long reviewId, String eaterEmail);

    List<Review> getScrapReviews(String email);

}
