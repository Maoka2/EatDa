package com.domain.review.dto.response;

import java.util.List;

public record ReviewFeedResult<T>(List<T> reviews, boolean nearbyReviewsFound, boolean hasNext) {

    public static <T> ReviewFeedResult<T> nearbyReviews(List<T> reviews, boolean hasNext) {
        return new ReviewFeedResult<>(reviews, true, hasNext);
    }

    public static <T> ReviewFeedResult<T> fallbackReviews(List<T> reviews, boolean hasNext) {
        return new ReviewFeedResult<>(reviews, false, hasNext);
    }

    public static <T> ReviewFeedResult<T> myReviews(List<T> reviews, boolean hasNext) {
        return new ReviewFeedResult<>(reviews, false, hasNext);
    }
}
