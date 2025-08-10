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

    @Query("SELECT ea FROM EventAsset ea " +
            "JOIN FETCH ea.event e " +
            "JOIN FETCH e.store s " +
            "JOIN FETCH s.maker " +
            "WHERE ea.id = :assetId")
    Optional<EventAsset> findByIdWithStore(@Param("assetId") Long assetId);

    @Query("SELECT ea FROM EventAsset ea WHERE ea.event.id IN :eventIds")
    List<EventAsset> findByEventIds(@Param("eventIds") List<Long> eventIds);
}
