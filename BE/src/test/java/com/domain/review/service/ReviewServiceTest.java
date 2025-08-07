package com.domain.review.service;

import com.domain.review.dto.response.ReviewDetailResponse;
import com.domain.review.dto.response.ReviewFeedResponse;
import com.domain.review.dto.response.ReviewFeedResult;
import com.domain.review.entity.Review;
import com.domain.review.repository.StoreRepository;
import com.domain.review.repository.ReviewRepository;
import com.global.constants.ErrorCode;
import com.global.exception.ApiException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReviewServiceTest {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private HaversineCalculator haversineCalculator;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Test
    @DisplayName("실제 데이터로 근처 리뷰 피드 조회 테스트")
    void getReviewFeed_WithRealData_Success() {
        // given - 실제 POI와 Store 데이터가 있는 위치
        Double latitude = 37.50476060280405;  // 신논현
        Double longitude = 127.02544090001382;
        Integer distance = 1000;
        Long lastReviewId = null;

        // when
        ReviewFeedResult<ReviewFeedResponse> result = reviewService.getReviewFeed(latitude, longitude, distance, lastReviewId);

        // then
        assertThat(result).isNotNull();
        assertThat(result.reviews()).isNotNull();
        
        // 근처 리뷰가 있거나 전체 리뷰가 반환되어야 함
        if (result.nearbyReviewsFound()) {
            System.out.println("근처 리뷰 발견: " + result.reviews().size() + "개");
            result.reviews().forEach(review -> {
                assertThat(review.reviewId()).isNotNull();
                assertThat(review.storeName()).isNotNull();
                assertThat(review.description()).isNotNull();
                assertThat(review.distance()).isNotNull();
                System.out.println("리뷰 ID: " + review.reviewId() + 
                                 ", 상점: " + review.storeName() + 
                                 ", 거리: " + review.distance() + "m");
            });
        } else {
            System.out.println("전체 리뷰 반환: " + result.reviews().size() + "개");
            result.reviews().forEach(review -> {
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
        ReviewFeedResult<ReviewFeedResponse> result = reviewService.getReviewFeed(latitude, longitude, distance, lastReviewId);

        // then
        assertThat(result).isNotNull();
        assertThat(result.reviews()).isNotNull();
        
        System.out.println("파이넨스센터 근처 검색 결과:");
        System.out.println("근처 리뷰 발견 여부: " + result.nearbyReviewsFound());
        System.out.println("리뷰 개수: " + result.reviews().size());
        result.reviews().forEach(review -> {
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
        ReviewFeedResult<ReviewFeedResponse> firstPage = reviewService.getReviewFeed(latitude, longitude, distance, null);
        
        // when - 첫 번째 페이지의 마지막 리뷰 ID를 사용해서 다음 페이지 조회
        if (!firstPage.reviews().isEmpty()) {
            Long lastReviewId = firstPage.reviews().getLast().reviewId();
            ReviewFeedResult<ReviewFeedResponse> secondPage = reviewService.getReviewFeed(latitude, longitude, distance, lastReviewId);
            
            // then
            assertThat(secondPage).isNotNull();
            assertThat(secondPage.reviews()).isNotNull();
            
            System.out.println("첫 번째 페이지 리뷰 개수: " + firstPage.reviews().size());
            System.out.println("두 번째 페이지 리뷰 개수: " + secondPage.reviews().size());
            System.out.println("마지막 리뷰 ID: " + lastReviewId);
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
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("거리별 검색 결과 비교 테스트")
    void getReviewFeed_CompareDistances_Success() {
        // given
        Double latitude = 37.50065600216521;
        Double longitude = 127.03642638316084;
        Long lastReviewId = null;

        // when - 다양한 거리로 검색
        ReviewFeedResult<ReviewFeedResponse> result700 = reviewService.getReviewFeed(latitude, longitude, 700, lastReviewId);
        ReviewFeedResult<ReviewFeedResponse> result850 = reviewService.getReviewFeed(latitude, longitude, 850, lastReviewId);
        ReviewFeedResult<ReviewFeedResponse> result1000 = reviewService.getReviewFeed(latitude, longitude, 1000, lastReviewId);
        ReviewFeedResult<ReviewFeedResponse> result2000 = reviewService.getReviewFeed(latitude, longitude, 2000, lastReviewId);

        // then
        System.out.println("=== 거리별 검색 결과 비교 ===");
        printReviewDetails("700m", result700);
        printReviewDetails("850m", result850);
        printReviewDetails("1000m", result1000);
        printReviewDetails("2000m", result2000);
    }

    @Test
    @DisplayName("리뷰 상세 조회 - 스크랩한 리뷰")
    void getReviewDetail_WithScrap_Success() {
        // given - 사용자 1이 스크랩한 리뷰 ID 1
        Long reviewId = 1L;
        Long currentUserId = 1L;

        // when
        ReviewDetailResponse result = reviewService.getReviewDetail(reviewId, currentUserId);

        // then
        assertThat(result.reviewId()).isEqualTo(reviewId);
        assertThat(result.isScrapped()).isTrue();
        assertThat(result.scrapCount()).isGreaterThan(0);

        System.out.println("=".repeat(50));
        System.out.println("           [ 리뷰 상세 정보 전체 출력 ]");
        System.out.println("=".repeat(50));
        System.out.println("📝 리뷰 ID: " + result.reviewId());
        System.out.println("💬 설명: " + result.description());
        System.out.println("📅 작성일: " + result.createdAt());
        System.out.println("🔖 스크랩 수: " + result.scrapCount());
        System.out.println("✅ 내가 스크랩했나?: " + (result.isScrapped() ? "예" : "아니오"));

        // 상점 정보
        if (result.store() != null) {
            System.out.println("\n🏪 상점 정보:");
            System.out.println("   ID: " + result.store().storeId());
            System.out.println("   이름: " + result.store().storeName());
            System.out.println("   주소: " + result.store().address());
            System.out.println("   위도: " + result.store().latitude());
            System.out.println("   경도: " + result.store().longitude());
        }

        // 유저 정보
        if (result.user() != null) {
            System.out.println("\n👤 작성자 정보:");
            System.out.println("   사용자 ID: " + result.user().userId());
            System.out.println("   닉네임: " + result.user().nickname());
        }
    }

    @Test
    @DisplayName("리뷰 상세 조회 - 스크랩하지 않은 리뷰")
    void getReviewDetail_WithoutScrap_Success() {
        // given - 사용자 1이 스크랩하지 않은 리뷰 ID 2
        Long reviewId = 2L;
        Long currentUserId = 1L;

        // when
        ReviewDetailResponse result = reviewService.getReviewDetail(reviewId, currentUserId);

        // then
        assertThat(result.isScrapped()).isFalse();

        System.out.println("=".repeat(50));
        System.out.println("           [ 리뷰 상세 정보 전체 출력 ]");
        System.out.println("=".repeat(50));
        System.out.println("📝 리뷰 ID: " + result.reviewId());
        System.out.println("💬 설명: " + result.description());
        System.out.println("📅 작성일: " + result.createdAt());
        System.out.println("🔖 스크랩 수: " + result.scrapCount());
        System.out.println("✅ 내가 스크랩했나?: " + (result.isScrapped() ? "예" : "아니오"));

        // 상점 정보
        if (result.store() != null) {
            System.out.println("\n🏪 상점 정보:");
            System.out.println("   ID: " + result.store().storeId());
            System.out.println("   이름: " + result.store().storeName());
            System.out.println("   주소: " + result.store().address());
            System.out.println("   위도: " + result.store().latitude());
            System.out.println("   경도: " + result.store().longitude());
        }

        // 유저 정보
        if (result.user() != null) {
            System.out.println("\n👤 작성자 정보:");
            System.out.println("   사용자 ID: " + result.user().userId());
            System.out.println("   닉네임: " + result.user().nickname());
        }
    }

    @Test
    @DisplayName("리뷰 상세 조회 - 여러 사용자가 스크랩한 리뷰")
    void getReviewDetail_MultipleScrap_Success() {
        // given - 두 사용자 모두 스크랩한 리뷰 ID 3
        Long reviewId = 3L;
        Long currentUserId = 1L;

        // when
        ReviewDetailResponse result = reviewService.getReviewDetail(reviewId, currentUserId);

        // then
        assertThat(result.scrapCount()).isEqualTo(2);
        assertThat(result.isScrapped()).isTrue();

        System.out.println("=".repeat(50));
        System.out.println("           [ 리뷰 상세 정보 전체 출력 ]");
        System.out.println("=".repeat(50));
        System.out.println("📝 리뷰 ID: " + result.reviewId());
        System.out.println("💬 설명: " + result.description());
        System.out.println("📅 작성일: " + result.createdAt());
        System.out.println("🔖 스크랩 수: " + result.scrapCount());
        System.out.println("✅ 내가 스크랩했나?: " + (result.isScrapped() ? "예" : "아니오"));

        // 상점 정보
        if (result.store() != null) {
            System.out.println("\n🏪 상점 정보:");
            System.out.println("   ID: " + result.store().storeId());
            System.out.println("   이름: " + result.store().storeName());
            System.out.println("   주소: " + result.store().address());
            System.out.println("   위도: " + result.store().latitude());
            System.out.println("   경도: " + result.store().longitude());
        }

        // 유저 정보
        if (result.user() != null) {
            System.out.println("\n👤 작성자 정보:");
            System.out.println("   사용자 ID: " + result.user().userId());
            System.out.println("   닉네임: " + result.user().nickname());
        }
    }

    @Test
    @DisplayName("존재하지 않는 리뷰 조회 실패")
    void getReviewDetail_NotFound_ThrowsException() {
        // given
        Long nonExistentReviewId = 999L;

        // when & then
        assertThatThrownBy(() -> reviewService.getReviewDetail(nonExistentReviewId, 1L))
                .isInstanceOf(ApiException.class);
    }

    @Test
    @DisplayName("리뷰 삭제 성공 테스트 - 작성자")
    void removeReviewDetail_Success_WhoUserIsOwner() {
        // given
        Long reviewId = 1L;
        Long userId = 2L;

        // when
        assertThat(reviewRepository.findById(reviewId)).isPresent();

        // then
        // 삭제 메서드 실행, 예외가 발생하지 않아야 함.
        assertThatNoException().isThrownBy(() -> {
            reviewService.removeReview(reviewId, userId);
        });

        Optional<Review> deletedReview = reviewRepository.findById(reviewId);
        assertThat(deletedReview).isEmpty();
    }

    @Test
    @DisplayName("리뷰 삭제 실패 테스트 - 존재하지 않는 리뷰 ID")
    void removeReview_Failure_WhenReviewNotFound() {
        // given
        Long reviewId = 0L;
        Long userId = 2L; //

        // when & then
        assertThatThrownBy(() -> reviewService.removeReview(reviewId, userId))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> {
                    ApiException apiException = (ApiException) e;
                    assertThat(apiException.getErrorCode()).isEqualTo(ErrorCode.RESOURCE_NOT_FOUND);
                });

        Optional<Review> review = reviewRepository.findById(reviewId);
        assertThat(review).isEmpty();
    }

    @Test
    @DisplayName("리뷰 삭제 실패 테스트 - 작성자가 아닌 경우")
    void removeReview_Failure_WhoUserIsNotOwner() {
        Long reviewId = 1L;
        Long userId = 1L;

        assertThatThrownBy(() -> reviewService.removeReview(reviewId, userId))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> {
                    ApiException apiException = (ApiException) e;
                    assertThat(apiException.getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN);
                });

        Optional<Review> review = reviewRepository.findById(reviewId);
        assertThat(review).isPresent();
    }

    @Test
    @DisplayName("리뷰 삭제 후 조회 실패 테스트")
    void getReviewDetail_Failure_AfterDelete() {
        // given
        Long reviewId = 1L;
        Long userId = 2L;

        // when
        reviewService.removeReview(reviewId, userId);

        // then
        assertThatThrownBy(() -> reviewService.getReviewDetail(reviewId, userId))
                .isInstanceOf(ApiException.class)
                .satisfies(e -> {
                    ApiException apiException = (ApiException) e;
                    assertThat(apiException.getErrorCode()).isEqualTo(ErrorCode.RESOURCE_NOT_FOUND);
                });
    }


    private void printReviewDetails(String radius, ReviewFeedResult<ReviewFeedResponse> result) {
        System.out.println("\n--- " + radius + " 검색 결과 ---");
        System.out.println("  총 리뷰 수: " + result.reviews().size());
        System.out.println("  상세 목록:");

        // 사용자 좌표 (고정)
        Double userLat = 37.50065600216521;
        Double userLon = 127.03642638316084;

        result.reviews().forEach(review -> {
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
