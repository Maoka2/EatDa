package com.domain.review.service;

import com.domain.review.dto.response.ReviewDetailResponse;
import com.domain.review.dto.response.ReviewFeedResponse;
import com.domain.review.dto.response.ReviewFeedResult;
import com.domain.review.dto.response.StoreDistanceResult;
import com.domain.review.entity.Poi;
import com.domain.review.entity.Review;
import com.domain.review.entity.Store;
import com.domain.review.repository.ReviewRepository;
import com.global.constants.ErrorCode;
import com.global.constants.SuccessCode;
import com.global.dto.response.SuccessResponse;
import com.global.exception.GlobalException;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final PoiStoreDistanceService poiStoreDistanceService;

    @Transactional(readOnly = true)
    public ReviewFeedResult getReviewFeed(Double latitude, Double longitude, Integer distance, Long lastReviewId) {
        try {
            Poi nearestPoi = poiStoreDistanceService.findNearestPoi(latitude, longitude);
            log.info("nearestPoi: {}", nearestPoi.getName());

            List<StoreDistanceResult> nearbyStores = poiStoreDistanceService.getNearbyStores(
                    nearestPoi.getId(), distance
            );

            if (!nearbyStores.isEmpty()) {
                List<Long> storeIds = nearbyStores.stream()
                        .map(StoreDistanceResult::storeId).toList();

                List<Review> reviews = reviewRepository.findByStoreIdInOrderByCreatedAtDesc(
                        storeIds, lastReviewId, PageRequest.of(0, 20)
                );

                if (!reviews.isEmpty()) {
                    Map<Long, Integer> storeDistanceMap = nearbyStores.stream()
                            .collect(Collectors.toMap(
                                    StoreDistanceResult::storeId,
                                    StoreDistanceResult::distance
                            ));

                    List<ReviewFeedResponse> feedResponses = reviews.stream()
                            .map(review -> ReviewFeedResponse.builder()
                                    .reviewId(review.getId())
                                    .storeName(review.getStore().getName())
                                    .description(review.getDescription())
//                                    .menuNames(List.of()) // 현재 엔티티에 없음
//                                    .assetUrl(null) // 현재 엔티티에 없음
                                    .distance(storeDistanceMap.get(review.getStore().getId()))
                                    .build())
                            .collect(Collectors.toList());

                    return ReviewFeedResult.nearbyReviews(feedResponses);
                }
            }

            List<Review> allReviews = reviewRepository.findAllOrderByCreatedAtDesc(
                    lastReviewId, PageRequest.of(0, 20)
            );

            List<ReviewFeedResponse> feedResponses = allReviews.stream()
                    .map(review -> ReviewFeedResponse.builder()
                            .reviewId(review.getId())
                            .storeName(review.getStore().getName())
                            .description(review.getDescription())
                            .menuNames(List.of())
//                            .assetUrl(null)
//                            .distance(null) // 전체 피드는 거리 정보 없음
                            .build()).toList();

            return ReviewFeedResult.fallbackReviews(feedResponses);
        } catch (NoSuchElementException e) {
            // POI를 찾을 수 없는 경우 전체 피드 제공
            log.warn("No POI found near ({}, {}), returning all reviews", latitude, longitude);
            return getFallbackFeed(lastReviewId);
        }
    }

    @Transactional(readOnly = true)
    public ReviewDetailResponse getReviewDetail(Long reviewId, Long currentUserId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new GlobalException(ErrorCode.BAD_REQUEST));

        Store store = review.getStore();

        int scrapCount = 0;
        boolean isScrapped = false;

        ReviewDetailResponse.UserInfo userInfo = ReviewDetailResponse.UserInfo.builder()
                .userId(1L) // 임시
                .nickname("테스트유저") // 임시
                .build();

        return ReviewDetailResponse.builder()
                .reviewId(review.getId())
                .store(ReviewDetailResponse.StoreInfo.builder()
                        .storeId(store.getId())
                        .storeName(store.getName())
                        .address("서울시 강남구") // Store 엔티티에 address 필드 없음
                        .latitude(store.getLatitude())
                        .longitude(store.getLongitude())
                        .build())
                .user(userInfo)
                .description(review.getDescription())
//                .menuNames(List.of()) // Review 엔티티에 menuNames 없음
//                .asset(AssetInfo.builder()
//                        .type("IMAGE")
//                        .assetUrl(null) // Review 엔티티에 assetUrl 없음
//                        .build())
//                .scrapCount(scrapCount)
//                .isScrapped(isScrapped)
                .createdAt(review.getCreatedAt())
                .build();
    }

    private ReviewFeedResult getFallbackFeed(Long lastReviewId) {
        List<Review> allReviews = reviewRepository.findAllOrderByCreatedAtDesc(
                lastReviewId, PageRequest.of(0, 20)
        );

        List<ReviewFeedResponse> feedResponses = allReviews.stream()
                .map(review -> ReviewFeedResponse.builder()
                        .reviewId(review.getId())
                        .storeName(review.getStore().getName())
                        .description(review.getDescription())
                        .menuNames(List.of())
                        .assetUrl(null)
                        .distance(null)
                        .build())
                .collect(Collectors.toList());

        return ReviewFeedResult.fallbackReviews(feedResponses);
    }
}
