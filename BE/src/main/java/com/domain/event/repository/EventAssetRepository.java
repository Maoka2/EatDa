package com.domain.event.repository;

import com.domain.event.entity.EventAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventAssetRepository extends JpaRepository<EventAsset, Long> {

    // EventAsset 조회 시 삭제된 Event는 제외
    @Query("SELECT ea FROM EventAsset ea " +
            "JOIN FETCH ea.event e " +
            "JOIN FETCH e.store s " +
            "JOIN FETCH s.maker " +
            "WHERE ea.id = :assetId " +
            "AND e.deleted = false " +  // Event deleted 체크 추가
            "AND s.deleted = false")  // Store deleted 체크 추가
    Optional<EventAsset> findByIdWithStore(@Param("assetId") Long assetId);

    // 삭제되지 않은 Event의 Asset만 조회
    @Query("SELECT ea FROM EventAsset ea " +
            "JOIN ea.event e " +
            "WHERE e.id IN :eventIds " +
            "AND e.deleted = false")  // Event deleted 체크 추가
    List<EventAsset> findByEventIds(@Param("eventIds") List<Long> eventIds);

    // Event 삭제 시 EventAsset도 함께 조회하기 위한 메서드
    Optional<EventAsset> findByEventId(Long eventId);
}
