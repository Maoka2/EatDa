package com.domain.review.service;


import com.domain.review.dto.request.ReviewAssetCallbackRequest;
import com.domain.review.dto.request.ReviewAssetCreateRequest;
import com.domain.review.dto.request.ReviewFinalizeRequest;
import com.domain.review.dto.response.MyReviewResponse;
import com.domain.review.dto.response.ReviewAssetRequestResponse;
import com.domain.review.dto.response.ReviewAssetResultResponse;
import com.domain.review.dto.response.ReviewDetailResponse;
import com.domain.review.dto.response.ReviewFeedResponse;
import com.domain.review.dto.response.ReviewFeedResult;
import com.domain.review.dto.response.ReviewFinalizeResponse;

public interface ReviewService {

    /**
     * 1단계 - 리뷰 에셋 생성 요청 처리
     */
    ReviewAssetRequestResponse requestReviewAsset(ReviewAssetCreateRequest request, Long userId);

    /**
     * 2단계 - FastAPI 콜백 처리 (에셋 생성 완료 후 상태/URL 반영)
     */
    void handleReviewAssetCallback(ReviewAssetCallbackRequest request);

    /**
     * 3단계 - 리뷰 에셋 결과 조회
     */
    ReviewAssetResultResponse getReviewAssetResult(Long reviewAssetId);

    /**
     * 4단계 - 리뷰 최종 등록
     */
    ReviewFinalizeResponse finalizeReview(ReviewFinalizeRequest request);

    ReviewFeedResult<ReviewFeedResponse> getReviewFeed(Double latitude, Double longitude, Integer distance,
                                                       Long lastReviewId);

    ReviewDetailResponse getReviewDetail(Long reviewId, Long currentUserId);

    ReviewFeedResult<MyReviewResponse> getMyReviews(Long userId, Long lastReviewId, int pageSize);

    void removeReview(Long reviewId, Long currentUserId);
}
