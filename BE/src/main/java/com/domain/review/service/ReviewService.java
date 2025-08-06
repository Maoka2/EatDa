package com.domain.review.service;

import com.domain.review.dto.response.ReviewFeedResponse;
import com.domain.review.dto.response.ReviewFeedResult;
import com.domain.review.dto.response.StoreDistanceResult;
import com.domain.review.entity.Poi;
import com.domain.review.entity.Review;
import com.domain.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
