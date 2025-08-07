package com.domain.review.dto.response;

import java.util.List;

public record ReviewFeedResult(List<ReviewFeedResponse> reviews, boolean nearbyReviewsFound, boolean hasNext ) {

    public static ReviewFeedResult nearbyReviews(List<ReviewFeedResponse> reviews, boolean hasNext) {
        return new ReviewFeedResult(reviews, true, hasNext);
    }

    public static ReviewFeedResult fallbackReviews(List<ReviewFeedResponse> reviews, boolean hasNext) {
        return new ReviewFeedResult(reviews, false, hasNext);
    }
}
