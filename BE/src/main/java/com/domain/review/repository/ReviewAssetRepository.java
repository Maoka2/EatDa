package com.domain.review.repository;

import com.domain.review.entity.ReviewAsset;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * 리뷰 에셋 데이터베이스 접근을 위한 Repository 인터페이스
 */
public interface ReviewAssetRepository extends JpaRepository<ReviewAsset, Long> {
    Optional<ReviewAsset> findById(Long id);
}
