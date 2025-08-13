package com.domain.review.repository;

import com.domain.review.entity.ReviewMenu;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * 리뷰 메뉴 데이터베이스 접근을 위한 Repository 인터페이스
 */
public interface ReviewMenuRepository extends JpaRepository<ReviewMenu, Long> {

    /**
     * 해당 리뷰와 메뉴의 조합이 이미 존재하는지 확인
     */
    boolean existsByReviewIdAndMenuId(Long reviewId, Long menuId);

    /**
     * 리뷰에 이미 등록된 메뉴 ID 목록 조회
     */
    @Query("""
                SELECT rm.menu.id
                FROM ReviewMenu rm
                WHERE rm.review.id = :reviewId AND rm.menu.id IN :menuIds
            """)
    List<Long> findExistingMenuIdsInReview(Long reviewId, List<Long> menuIds);
}
