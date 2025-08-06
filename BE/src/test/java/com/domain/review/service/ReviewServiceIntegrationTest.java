package com.domain.review.service;

import com.domain.review.dto.response.ReviewDetailResponse;
import com.domain.review.dto.response.ReviewFeedResult;
import com.global.exception.GlobalException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReviewServiceIntegrationTest {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private HaversineCalculator haversineCalculator;

    @Autowired
    private com.domain.review.repository.StoreRepository storeRepository;

    @Autowired
    private com.domain.review.repository.ReviewRepository reviewRepository;

    @Test
    @DisplayName("실제 데이터로 근처 리뷰 피드 조회 테스트")
    void getReviewFeed_WithRealData_Success() {
        // given - 실제 POI와 Store 데이터가 있는 위치
        Double latitude = 37.50476060280405;  // 신논현
        Double longitude = 127.02544090001382;
        Integer distance = 1000;
        Long lastReviewId = null;

        // when
        ReviewFeedResult result = reviewService.getReviewFeed(latitude, longitude, distance, lastReviewId);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getReviews()).isNotNull();
        
        // 근처 리뷰가 있거나 전체 리뷰가 반환되어야 함
        if (result.isNearbyReviewsFound()) {
            System.out.println("근처 리뷰 발견: " + result.getReviews().size() + "개");
            result.getReviews().forEach(review -> {
                assertThat(review.reviewId()).isNotNull();
                assertThat(review.storeName()).isNotNull();
                assertThat(review.description()).isNotNull();
                assertThat(review.distance()).isNotNull();
                System.out.println("리뷰 ID: " + review.reviewId() + 
                                 ", 상점: " + review.storeName() + 
                                 ", 거리: " + review.distance() + "m");
            });
        } else {
            System.out.println("전체 리뷰 반환: " + result.getReviews().size() + "개");
            result.getReviews().forEach(review -> {
                assertThat(review.reviewId()).isNotNull();
                assertThat(review.storeName()).isNotNull();
                assertThat(review.description()).isNotNull();
                System.out.println("리뷰 ID: " + review.reviewId() + 
                                 ", 상점: " + review.storeName() + 
                                 ", 설명: " + review.description());
            });
        }
    }

    @Test
    @DisplayName("다른 지역에서 리뷰 피드 조회 테스트")
    void getReviewFeed_DifferentLocation_Success() {
        // given - 다른 지역 (역삼 파이넨스 센터)
        Double latitude = 37.5000242405515;
        Double longitude = 127.036508620542;
        Integer distance = 850;
        Long lastReviewId = null;

        // when
        ReviewFeedResult result = reviewService.getReviewFeed(latitude, longitude, distance, lastReviewId);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getReviews()).isNotNull();
        
        System.out.println("파이넨스센터 근처 검색 결과:");
        System.out.println("근처 리뷰 발견 여부: " + result.isNearbyReviewsFound());
        System.out.println("리뷰 개수: " + result.getReviews().size());
        result.getReviews().forEach(review -> {
            assertThat(review.reviewId()).isNotNull();
            assertThat(review.storeName()).isNotNull();
            assertThat(review.description()).isNotNull();
            assertThat(review.distance()).isNotNull();
            System.out.println("리뷰 ID: " + review.reviewId() +
                    ", 상점: " + review.storeName() +
                    ", 거리: " + review.distance() + "m");
        });

    }

    @Test
    @DisplayName("페이징 기능 테스트 - lastReviewId 사용")
    void getReviewFeed_WithPagination_Success() {
        // given
        Double latitude = 37.5000242405515;
        Double longitude = 127.036508620542;
        Integer distance = 1000;

        // 첫 번째 페이지 조회
        ReviewFeedResult firstPage = reviewService.getReviewFeed(latitude, longitude, distance, null);
        
        // when - 첫 번째 페이지의 마지막 리뷰 ID를 사용해서 다음 페이지 조회
        if (!firstPage.getReviews().isEmpty()) {
            Long lastReviewId = firstPage.getReviews().get(firstPage.getReviews().size() - 1).reviewId();
            ReviewFeedResult secondPage = reviewService.getReviewFeed(latitude, longitude, distance, lastReviewId);
            
            // then
            assertThat(secondPage).isNotNull();
            assertThat(secondPage.getReviews()).isNotNull();
            
            System.out.println("첫 번째 페이지 리뷰 개수: " + firstPage.getReviews().size());
            System.out.println("두 번째 페이지 리뷰 개수: " + secondPage.getReviews().size());
            System.out.println("마지막 리뷰 ID: " + lastReviewId);
        }
    }

    @Test
    @DisplayName("실제 데이터로 리뷰 상세 조회 테스트")
    void getReviewDetail_WithRealData_Success() {
        // given - 먼저 존재하는 리뷰를 찾기
        ReviewFeedResult feedResult = reviewService.getReviewFeed(37.5665, 126.9780, 1000, null);
        
        if (!feedResult.getReviews().isEmpty()) {
            Long existingReviewId = feedResult.getReviews().get(0).reviewId();
            Long currentUserId = 1L;

            // when
            ReviewDetailResponse result = reviewService.getReviewDetail(existingReviewId, currentUserId);

            // then
            assertThat(result).isNotNull();
            assertThat(result.reviewId()).isEqualTo(existingReviewId);
            assertThat(result.description()).isNotNull();
            assertThat(result.store()).isNotNull();
            assertThat(result.store().storeId()).isNotNull();
            assertThat(result.store().storeName()).isNotNull();
            assertThat(result.store().latitude()).isNotNull();
            assertThat(result.store().longitude()).isNotNull();
            assertThat(result.user()).isNotNull();
            assertThat(result.createdAt()).isNotNull();

            System.out.println("리뷰 상세 정보:");
            System.out.println("리뷰 ID: " + result.reviewId());
            System.out.println("설명: " + result.description());
            System.out.println("상점명: " + result.store().storeName());
            System.out.println("위치: " + result.store().latitude() + ", " + result.store().longitude());
            System.out.println("작성일: " + result.createdAt());
        }
    }

    @Test
    @DisplayName("존재하지 않는 리뷰 ID로 상세 조회 실패 테스트")
    void getReviewDetail_WithInvalidId_ThrowsException() {
        // given
        Long nonExistentReviewId = 999999L;
        Long currentUserId = 1L;

        // when & then
        assertThatThrownBy(() -> reviewService.getReviewDetail(nonExistentReviewId, currentUserId))
                .isInstanceOf(GlobalException.class);
    }

    @Test
    @DisplayName("거리별 검색 결과 비교 테스트")
    void getReviewFeed_CompareDistances_Success() {
        // given
        Double latitude = 37.50065600216521;
        Double longitude = 127.03642638316084;
        Long lastReviewId = null;

        // when - 다양한 거리로 검색
//        ReviewFeedResult result700 = reviewService.getReviewFeed(latitude, longitude, 700, lastReviewId);
//        ReviewFeedResult result850 = reviewService.getReviewFeed(latitude, longitude, 850, lastReviewId);
//        ReviewFeedResult result1000 = reviewService.getReviewFeed(latitude, longitude, 1000, lastReviewId);
        ReviewFeedResult result2000 = reviewService.getReviewFeed(latitude, longitude, 2000, lastReviewId);

        // then
        System.out.println("=== 거리별 검색 결과 비교 ===");
//        System.out.println("700m 검색 - 근처 리뷰: " + result700.isNearbyReviewsFound() +
//                         ", 개수: " + result700.getReviews().size());
//        System.out.println("850m 검색 - 근처 리뷰: " + result850.isNearbyReviewsFound() +
//                         ", 개수: " + result850.getReviews().size());
//        System.out.println("1000m 검색 - 근처 리뷰: " + result1000.isNearbyReviewsFound() +
//                         ", 개수: " + result1000.getReviews().size());
//        System.out.println("2000m 검색 - 근처 리뷰: " + result2000.isNearbyReviewsFound() +
//                ", 개수: " + result2000.getReviews().size());
//        printReviewDetails("700m", result700);
//        printReviewDetails("850m", result850);
//        printReviewDetails("1000m", result1000);
        printReviewDetails("2000m", result2000);

        // 거리가 클수록 더 많은 결과가 나올 가능성이 높음 (근처 리뷰가 있다면)
//        if (result700.isNearbyReviewsFound() && result2000.isNearbyReviewsFound()) {
//            assertThat(result2000.getReviews().size()).isGreaterThanOrEqualTo(result700.getReviews().size());
//        }
    }

    private void printReviewDetails(String radius, ReviewFeedResult result) {
        System.out.println("\n--- " + radius + " 검색 결과 ---");
        System.out.println("  총 리뷰 수: " + result.getReviews().size());
        System.out.println("  상세 목록:");

        // 사용자 좌표 (고정)
        Double userLat = 37.50065600216521;
        Double userLon = 127.03642638316084;

        result.getReviews().forEach(review -> {
            // Store 정보 조회해서 실제 좌표 가져오기
            storeRepository.findById(getStoreIdFromReview(review))
                .ifPresentOrElse(store -> {
                    // 실제 Store 좌표로 거리 계산
                    double calculatedDistance = haversineCalculator.calculate(
                        userLat, userLon, store.getLatitude(), store.getLongitude());
                    
                    System.out.println("    - 리뷰 ID: " + review.reviewId() +
                        ", 상점: " + review.storeName() +
                        ", 시스템 거리: " + review.distance() + "m" +
                        ", 실제 좌표: (" + store.getLatitude() + ", " + store.getLongitude() + ")" +
                        ", 계산된 거리: " + String.format("%.0f", calculatedDistance) + "m");
                }, () -> {
                    System.out.println("    - 리뷰 ID: " + review.reviewId() +
                        ", 상점: " + review.storeName() +
                        ", 시스템 거리: " + review.distance() + "m" +
                        ", [Store 정보 없음]");
                });
        });
    }

    // Review에서 Store ID를 추출하는 헬퍼 메소드
    private Long getStoreIdFromReview(com.domain.review.dto.response.ReviewFeedResponse review) {
        return reviewRepository.findById(review.reviewId())
            .map(reviewEntity -> reviewEntity.getStore().getId())
            .orElse(null);
    }
}
