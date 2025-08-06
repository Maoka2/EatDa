package com.domain.review.dto.response;

import lombok.Getter;

import java.util.List;

import lombok.Getter;
import java.util.List;

@Getter
public class ReviewFeedResult {
    private final List<ReviewFeedResponse> reviews;
    private final boolean nearbyReviewsFound;

    private ReviewFeedResult(List<ReviewFeedResponse> reviews, boolean nearbyReviewsFound) {
        this.reviews = reviews;
        this.nearbyReviewsFound = nearbyReviewsFound;
    }

    public static ReviewFeedResult nearbyReviews(List<ReviewFeedResponse> reviews) {
        return new ReviewFeedResult(reviews, true);
    }

    public static ReviewFeedResult fallbackReviews(List<ReviewFeedResponse> reviews) {
        return new ReviewFeedResult(reviews, false);
    }
}
