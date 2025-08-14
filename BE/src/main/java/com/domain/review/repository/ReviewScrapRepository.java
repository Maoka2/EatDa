package com.domain.review.repository;

import com.domain.review.entity.ReviewScrap;
import io.lettuce.core.dynamic.annotation.Param;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewScrapRepository extends JpaRepository<ReviewScrap, Long> {
    /**
     * 특정 사용자가 특정 리뷰를 스크랩했는지 확인
     *
     * @param userId   사용자 ID
     * @param reviewId 리뷰 ID
     * @return 스크랩 엔티티 (Optional)
     */
    @Query("SELECT rs FROM ReviewScrap rs WHERE rs.user.id = :userId AND rs.review.id = :reviewId")
    Optional<ReviewScrap> findByUserIdAndReviewId(@Param("userId") Long userId, @Param("reviewId") Long reviewId);

    /**
     * 특정 리뷰의 스크랩 수 조회
     *
     * @param reviewId 리뷰 ID
     * @return 스크랩 수
     */
    int countByReviewId(Long reviewId);

    Long countByUserId(Long userId);
}
