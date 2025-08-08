//package com.a609.eatda.domain.review.service;
//
//import static org.assertj.core.api.Assertions.assertThat;
//import static org.assertj.core.api.Assertions.assertThatThrownBy;
//
//import com.domain.review.dto.response.ReviewScrapResult;
//import com.domain.review.entity.ReviewScrap;
//import com.domain.review.repository.ReviewScrapRepository;
//import com.domain.review.service.ReviewScrapService;
//import com.global.exception.ApiException;
//import jakarta.transaction.Transactional;
//import java.util.Optional;
//import org.junit.jupiter.api.DisplayName;
//import org.junit.jupiter.api.Test;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.context.SpringBootTest;
//import org.springframework.test.context.ActiveProfiles;
//
//@SpringBootTest
//@ActiveProfiles("test")
//@Transactional
//class ReviewScrapServiceTest {
//
//    @Autowired
//    private ReviewScrapService reviewScrapService;
//
//    @Autowired
//    private ReviewScrapRepository reviewScrapRepository;
//
//    @Test
//    @DisplayName("리뷰 스크랩 - 첫 번째 스크랩 (신규 추가)")
//    void toggleScrap_NewScrap_Success() {
//        // given
//        Long reviewId = 4L;  // 실제 존재하는 리뷰 ID
//        Long userId = 1L;    // 실제 존재하는 사용자 ID
//
//        // 스크랩이 없는 상태 확인
//        Optional<ReviewScrap> beforeScrap = reviewScrapRepository.findByUserIdAndReviewId(userId, reviewId);
//        assertThat(beforeScrap).isEmpty();
//
//        // when
//        ReviewScrapResult result = reviewScrapService.toggleScrap(reviewId, userId);
//
//        // then
//        assertThat(result.isNewScrap()).isTrue();
//        assertThat(result.scrapCount()).isGreaterThan(0);
//
//        // DB에 스크랩 생성 확인
//        Optional<ReviewScrap> afterScrap = reviewScrapRepository.findByUserIdAndReviewId(userId, reviewId);
//        assertThat(afterScrap).isPresent();
//
//        System.out.println("=== 신규 스크랩 결과 ===");
//        System.out.println("리뷰 ID: " + reviewId);
//        System.out.println("사용자 ID: " + userId);
//        System.out.println("신규 스크랩 여부: " + result.isNewScrap());
//        System.out.println("현재 스크랩 수: " + result.scrapCount());
//    }
//
//    @Test
//    @DisplayName("리뷰 스크랩 - 기존 스크랩 취소")
//    void toggleScrap_RemoveScrap_Success() {
//        // given - 이미 스크랩된 리뷰
//        Long reviewId = 1L;  // 이미 스크랩된 리뷰
//        Long userId = 1L;    // 스크랩한 사용자
//
//        // 스크랩 존재 확인
//        Optional<ReviewScrap> beforeScrap = reviewScrapRepository.findByUserIdAndReviewId(userId, reviewId);
//        assertThat(beforeScrap).isPresent();
//        int beforeCount = reviewScrapRepository.countByReviewId(reviewId);
//
//        // when - 스크랩 취소
//        ReviewScrapResult result = reviewScrapService.toggleScrap(reviewId, userId);
//
//        // then
//        assertThat(result.isNewScrap()).isFalse();
//        assertThat(result.scrapCount()).isEqualTo(beforeCount - 1);
//
//        // DB에서 스크랩 삭제 확인
//        Optional<ReviewScrap> afterScrap = reviewScrapRepository.findByUserIdAndReviewId(userId, reviewId);
//        assertThat(afterScrap).isEmpty();
//
//        System.out.println("=== 스크랩 취소 결과 ===");
//        System.out.println("리뷰 ID: " + reviewId);
//        System.out.println("사용자 ID: " + userId);
//        System.out.println("신규 스크랩 여부: " + result.isNewScrap());
//        System.out.println("이전 스크랩 수: " + beforeCount);
//        System.out.println("현재 스크랩 수: " + result.scrapCount());
//    }
//
//    @Test
//    @DisplayName("리뷰 스크랩 토글 - 여러 번 반복")
//    void toggleScrap_Multiple_Success() {
//        // given
//        Long reviewId = 2L;
//        Long userId = 1L;
//
//        System.out.println("=== 스크랩 토글 반복 테스트 ===");
//
//        // 첫 번째: 스크랩 추가
//        ReviewScrapResult result1 = reviewScrapService.toggleScrap(reviewId, userId);
//        assertThat(result1.isNewScrap()).isTrue();
//        System.out.println("1회: 스크랩 추가 - " + result1.scrapCount() + "개");
//
//        // 두 번째: 스크랩 취소
//        ReviewScrapResult result2 = reviewScrapService.toggleScrap(reviewId, userId);
//        assertThat(result2.isNewScrap()).isFalse();
//        assertThat(result2.scrapCount()).isEqualTo(result1.scrapCount() - 1);
//        System.out.println("2회: 스크랩 취소 - " + result2.scrapCount() + "개");
//
//        // 세 번째: 다시 스크랩 추가
//        ReviewScrapResult result3 = reviewScrapService.toggleScrap(reviewId, userId);
//        assertThat(result3.isNewScrap()).isTrue();
//        assertThat(result3.scrapCount()).isEqualTo(result2.scrapCount() + 1);
//        System.out.println("3회: 다시 스크랩 추가 - " + result3.scrapCount() + "개");
//    }
//
//    @Test
//    @DisplayName("여러 사용자가 같은 리뷰 스크랩")
//    void toggleScrap_MultipleUsers_Success() {
//        // given
//        Long reviewId = 4L;
//        Long user1Id = 1L;
//        Long user2Id = 2L;
//
//        // when - 사용자 1이 스크랩
//        ReviewScrapResult result1 = reviewScrapService.toggleScrap(reviewId, user1Id);
//
//        // when - 사용자 2가 스크랩
//        ReviewScrapResult result2 = reviewScrapService.toggleScrap(reviewId, user2Id);
//
//        // then
//        assertThat(result1.isNewScrap()).isTrue();
//        assertThat(result2.isNewScrap()).isTrue();
//        assertThat(result2.scrapCount()).isEqualTo(result1.scrapCount() + 1);
//
//        // 각 사용자의 스크랩 상태 확인
//        Optional<ReviewScrap> user1Scrap = reviewScrapRepository.findByUserIdAndReviewId(user1Id, reviewId);
//        Optional<ReviewScrap> user2Scrap = reviewScrapRepository.findByUserIdAndReviewId(user2Id, reviewId);
//
//        assertThat(user1Scrap).isPresent();
//        assertThat(user2Scrap).isPresent();
//
//        System.out.println("=== 다중 사용자 스크랩 테스트 ===");
//        System.out.println("리뷰 ID: " + reviewId);
//        System.out.println("사용자 1 스크랩 후: " + result1.scrapCount() + "개");
//        System.out.println("사용자 2 스크랩 후: " + result2.scrapCount() + "개");
//        System.out.println("최종 스크랩 수: " + reviewScrapRepository.countByReviewId(reviewId) + "개");
//    }
//
//    @Test
//    @DisplayName("존재하지 않는 리뷰 스크랩 시 예외 발생")
//    void toggleScrap_ReviewNotFound_ThrowsException() {
//        // given
//        Long nonExistentReviewId = 999999L;
//        Long userId = 1L;
//
//        // when & then
//        assertThatThrownBy(() -> reviewScrapService.toggleScrap(nonExistentReviewId, userId))
//                .isInstanceOf(ApiException.class);
//
//        System.out.println("존재하지 않는 리뷰 ID " + nonExistentReviewId + "로 스크랩 시도 시 예외 발생 확인");
//    }
//
//    @Test
//    @DisplayName("null 사용자 ID로 스크랩 시 예외 발생")
//    void toggleScrap_NullUserId_ThrowsException() {
//        // given
//        Long reviewId = 1L;
//        Long nullUserId = null;
//
//        // when & then
//        assertThatThrownBy(() -> reviewScrapService.toggleScrap(reviewId, nullUserId))
//                .isInstanceOf(ApiException.class);
//
//        System.out.println("null 사용자 ID로 스크랩 시도 시 예외 발생 확인");
//    }
//
//    @Test
//    @DisplayName("스크랩 수 조회 - 스크랩이 많은 리뷰")
//    void getScrapCount_PopularReview() {
//        // given
//        Long reviewId = 4L;
//        Long[] userIds = {1L, 2L};  // 2명의 사용자
//
//        System.out.println("=== 인기 리뷰 스크랩 테스트 ===");
//        System.out.println("리뷰 ID: " + reviewId);
//
//        // when - 2명이 차례로 스크랩
//        for (int i = 0; i < userIds.length; i++) {
//            ReviewScrapResult result = reviewScrapService.toggleScrap(reviewId, userIds[i]);
//            System.out.println("사용자 " + userIds[i] + " 스크랩 후: " + result.scrapCount() + "개");
//
//            assertThat(result.isNewScrap()).isTrue();
//            assertThat(result.scrapCount()).isEqualTo(i + 1);
//        }
//
//        // then - 최종 확인
//        int finalCount = reviewScrapRepository.countByReviewId(reviewId);
//        assertThat(finalCount).isEqualTo(userIds.length);
//        System.out.println("최종 스크랩 수: " + finalCount + "개");
//    }
//
//    @Test
//    @DisplayName("스크랩 데이터 실제 확인")
//    void verifyScrapData() {
//        // given
//        Long reviewId = 4L;
//        Long userId = 1L;
//
//        // when
//        reviewScrapService.toggleScrap(reviewId, userId);
//
//        // then - 실제 DB 데이터 확인
//        Optional<ReviewScrap> scrap = reviewScrapRepository.findByUserIdAndReviewId(userId, reviewId);
//        assertThat(scrap).isPresent();
//
//        ReviewScrap scrapEntity = scrap.get();
//        System.out.println("=== 스크랩 엔티티 정보 ===");
//        System.out.println("스크랩 ID: " + scrapEntity.getId());
//        System.out.println("리뷰 ID: " + (scrapEntity.getReview() != null ? scrapEntity.getReview().getId() : "null"));
//        System.out.println("사용자 ID: " + (scrapEntity.getUser() != null ? scrapEntity.getUser().getId() : "null"));
//        System.out.println("생성일: " + scrapEntity.getCreatedAt());
//
//        // 스크랩 카운트도 확인
//        int count = reviewScrapRepository.countByReviewId(reviewId);
//        System.out.println("해당 리뷰 총 스크랩 수: " + count);
//    }
//}
