package com.domain.review.repository;

import com.domain.review.entity.PoiDistance;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PoiDistanceRepository extends JpaRepository<PoiDistance, Long> {
    /**
     * 특정 POI에서 지정된 거리 이내의 가게 목록 조회 (거리순 정렬)
     */
    List<PoiDistance> findByPoiIdAndDistanceLessThanEqualOrderByDistanceAsc(
            Long poiId,
            int maxDistance
    );

    /**
     * 특정 가게의 모든 거리 정보 조회
     */
    List<PoiDistance> findByStoreId(Long storeId);

    /**
     * 특정 가게의 모든 거리 정보 삭제
     */
    @Modifying
    @Query("DELETE FROM PoiDistance pd WHERE pd.storeId = :storeId")
    void deleteByStoreId(@Param("storeId") Long storeId);

    /**
     * POI-Store 조합의 중복 체크
     */
    boolean existsByPoiIdAndStoreId(Long poiId, Long storeId);
}
