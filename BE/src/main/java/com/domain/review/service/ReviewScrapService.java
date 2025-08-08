package com.domain.review.service;

import com.domain.review.dto.response.ReviewScrapResult;
import com.domain.review.entity.Review;
import com.domain.review.entity.ReviewScrap;
import com.domain.review.repository.ReviewRepository;
import com.domain.review.repository.ReviewScrapRepository;
import com.domain.review.repository.UserRepository;
import com.domain.user.entity.User;
import com.global.constants.ErrorCode;
import com.global.exception.ApiException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewScrapService {

    private final ReviewRepository reviewRepository;
    private final ReviewScrapRepository reviewScrapRepository;
    private final UserRepository userRepository;

    /**
     * 리뷰 스크랩 토글 처리
     *
     * @param reviewId 대상 리뷰 ID
     * @param userId   현재 사용자 ID
     * @return 스크랩 결과 (신규 스크랩 여부, 현재 스크랩 수)
     */
    public ReviewScrapResult toggleScrap(Long reviewId, Long userId) {
        if (userId == null) {
            throw new ApiException(ErrorCode.UNAUTHORIZED);
        }

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ApiException(ErrorCode.SCRAP_NOT_FOUND));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(ErrorCode.SCRAP_NOT_FOUND));

        Optional<ReviewScrap> existingScrap = reviewScrapRepository.findByUserIdAndReviewId(userId, reviewId);

        boolean isNewScrap;

        if (existingScrap.isPresent()) {
            removeScrap(existingScrap.get());
            isNewScrap = false;
        } else {
            createScrap(review, user);
            isNewScrap = true;
        }

        return new ReviewScrapResult(isNewScrap, getScrapCount(reviewId));

    }

    /**
     * 스크랩 추가
     *
     * @param review 대상 리뷰
     * @param user   스크랩하는 사용자
     */
    private void createScrap(Review review, User user) {
        ReviewScrap scrap = ReviewScrap.builder()
                .user(user)
                .review(review).build();

        ReviewScrap savedScrap = reviewScrapRepository.save(scrap);

        // 객체 그래프 일관성을 위함이라는데 아직 이해 못함
        review.getScraps().add(savedScrap);
        user.getScraps().add(savedScrap);

    }

    /**
     * 스크랩 삭제
     *
     * @param existingScrap 삭제할 스크랩
     */
    private void removeScrap(ReviewScrap existingScrap) {
        if (existingScrap == null) {
            return;
        }

        // 객체 그래프 일관성을 위함이라는데 아직 이해 못함
        Review associatedReview = existingScrap.getReview();
        if (associatedReview != null) {
            associatedReview.removeScrap(existingScrap);
        }

        User associatedUser = existingScrap.getUser();
        if (associatedUser != null) {
            associatedUser.removeScrap(existingScrap);
        }

        reviewScrapRepository.delete(existingScrap);
    }

    /**
     * 리뷰의 현재 스크랩 수 조회
     *
     * @param reviewId 리뷰 ID
     * @return 스크랩 수
     */
    private int getScrapCount(Long reviewId) {
        if (reviewId == null) {
            return 0;
        }

        return reviewScrapRepository.countByReviewId(reviewId);
    }
}
