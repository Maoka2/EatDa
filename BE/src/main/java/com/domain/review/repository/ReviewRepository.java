package com.domain.review.repository;

import com.domain.review.entity.Review;
import java.util.List;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

/**
 * 리뷰 데이터베이스 접근을 위한 Repository 인터페이스
 */
public interface ReviewRepository extends JpaRepository<Review, Long> {
    /**
     * 특정 Store들의 리뷰를 최신순으로 조회 (무한스크롤)
     */
    @Query("SELECT r FROM Review r " +
            "WHERE r.store.id IN :storeIds " +
            "AND (:lastReviewId IS NULL OR r.id < :lastReviewId) " +
            "ORDER BY r.id DESC")
    List<Review> findByStoreIdInOrderByIdDesc(
            @Param("storeIds") List<Long> storeIds,
            @Param("lastReviewId") Long lastReviewId,
            Pageable pageable
    );

    /**
     * 사용자 ID로 리뷰 목록 조회
     * 전체 리뷰를 최신순으로 조회 (무한스크롤)
     */
    List<Review> findByUserId(Long userId);
    @Query("SELECT r FROM Review r " +
            "WHERE :lastReviewId IS NULL OR r.id < :lastReviewId " +
            "ORDER BY r.id DESC")
    List<Review> findAllOrderByIdDesc(
            @Param("lastReviewId") Long lastReviewId,
            Pageable pageable
    );

    /**
     * 가게 ID로 리뷰 목록 조회
     * Store별 리뷰 개수 조회
     */
    List<Review> findByStoreId(Long storeId);
    @Query("SELECT r.store.id, COUNT(r) FROM Review r " +
            "WHERE r.store.id IN :storeIds " +
            "GROUP BY r.store.id")
    List<Object[]> countByStoreIds(@Param("storeIds") List<Long> storeIds);

    @Query("SELECT r FROM Review r " +
            "LEFT JOIN FETCH r.user " +
            "LEFT JOIN FETCH r.store " +
            "LEFT JOIN FETCH r.scraps s " +
            "LEFT JOIN FETCH s.user " +
            "WHERE r.id = :reviewId")
    Optional<Review> findByIdWithDetails(@Param("reviewId") Long reviewId);

    @Query("""
    SELECT r FROM Review r
    LEFT JOIN FETCH r.store
    WHERE r.user.id = :userId
      AND (:lastReviewId IS NULL OR r.id < :lastReviewId)
    ORDER BY r.id DESC
    """)
    List<Review> findMyReviews(
            @Param("userId") Long userId,
            @Param("lastReviewId") Long lastReviewId,
            Pageable pageable
    );
}
