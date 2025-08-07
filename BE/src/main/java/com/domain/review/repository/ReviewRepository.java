package com.domain.review.repository;

import com.domain.review.entity.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 리뷰 데이터베이스 접근을 위한 Repository 인터페이스
 */
public interface ReviewRepository extends JpaRepository<Review, Long> {

    /**
     * 사용자 ID로 리뷰 목록 조회
     */
    List<Review> findByUserId(Long userId);

    /**
     * 가게 ID로 리뷰 목록 조회
     */
    List<Review> findByStoreId(Long storeId);
}
