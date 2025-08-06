package com.domain.review.repository;

import com.domain.review.entity.Review;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    /**
     * 특정 Store들의 리뷰를 최신순으로 조회 (무한스크롤)
     */
    @Query("SELECT r FROM Review r " +
            "WHERE r.store.id IN :storeIds " +
            "AND (:lastReviewId IS NULL OR r.id < :lastReviewId) " +
            "ORDER BY r.createdAt DESC, r.id DESC")
    List<Review> findByStoreIdInOrderByCreatedAtDesc(
            @Param("storeIds") List<Long> storeIds,
            @Param("lastReviewId") Long lastReviewId,
            Pageable pageable
    );

    /**
     * 전체 리뷰를 최신순으로 조회 (무한스크롤)
     */
    @Query("SELECT r FROM Review r " +
            "WHERE :lastReviewId IS NULL OR r.id < :lastReviewId " +
            "ORDER BY r.createdAt DESC, r.id DESC")
    List<Review> findAllOrderByCreatedAtDesc(
            @Param("lastReviewId") Long lastReviewId,
            Pageable pageable
    );

    /**
     * Store별 리뷰 개수 조회
     */
    @Query("SELECT r.store.id, COUNT(r) FROM Review r " +
            "WHERE r.store.id IN :storeIds " +
            "GROUP BY r.store.id")
    List<Object[]> countByStoreIds(@Param("storeIds") List<Long> storeIds);
}
