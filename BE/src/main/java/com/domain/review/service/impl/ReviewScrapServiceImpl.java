package com.domain.review.service.impl;

import static com.global.constants.ErrorCode.FORBIDDEN;

import com.domain.review.dto.response.ReviewScrapResult;
import com.domain.review.entity.Review;
import com.domain.review.entity.ReviewScrap;
import com.domain.review.repository.ReviewRepository;
import com.domain.review.repository.ReviewScrapRepository;
import com.domain.review.service.ReviewScrapService;
import com.domain.user.entity.User;
import com.domain.user.repository.EaterRepository;
import com.global.constants.ErrorCode;
import com.global.exception.ApiException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewScrapServiceImpl implements ReviewScrapService {

    private final ReviewRepository reviewRepository;
    private final ReviewScrapRepository reviewScrapRepository;
    private final EaterRepository eaterRepository;

    /**
     * 리뷰 스크랩 토글 처리
     *
     * @param reviewId   대상 리뷰 ID
     * @param eaterEmail
     * @return 스크랩 결과 (신규 스크랩 여부, 현재 스크랩 수)
     */
    public ReviewScrapResult toggleScrap(final Long reviewId, final String eaterEmail) {
        User eater = findEaterByEmail(eaterEmail);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ApiException(ErrorCode.SCRAP_NOT_FOUND));

        Optional<ReviewScrap> existingScrap = reviewScrapRepository.findByUserIdAndReviewId(eater.getId(), reviewId);

        boolean isNewScrap;

        if (existingScrap.isPresent()) {
            removeScrap(existingScrap.get());
            isNewScrap = false;
        } else {
            createScrap(review, eater);
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
    private void createScrap(final Review review, final User user) {
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
    private void removeScrap(final ReviewScrap existingScrap) {
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
    private int getScrapCount(final Long reviewId) {
        if (reviewId == null) {
            return 0;
        }

        return reviewScrapRepository.countByReviewId(reviewId);
    }

    private User findEaterByEmail(final String eaterEmail) {
        return eaterRepository.findByEmailAndDeletedFalse(eaterEmail)
                .orElseThrow(() -> new ApiException(FORBIDDEN));
    }
}
