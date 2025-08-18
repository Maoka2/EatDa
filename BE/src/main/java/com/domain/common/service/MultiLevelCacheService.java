package com.domain.common.service;

import com.domain.review.dto.response.StoreDistanceResult;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class MultiLevelCacheService {

    private final CacheService l2Cache;
    private final CacheMetricsService cacheMetricsService;
    private final CacheMetadataService cacheMetadataService;
    private final PoiAccessTrackingService accessTrackingService;

    // L1 캐시 (Caffeine - 로컬 메모리)
    private final Cache<String, List<StoreDistanceResult>> l1Cache = Caffeine.newBuilder()
            .maximumSize(10) // 최대 10개 항목
            .expireAfterWrite(60, TimeUnit.MINUTES) // 60분 후 만료
            .recordStats() // 통계 수집
            .build();

    public record CacheStats(
            long hitCount,
            long missCount,
            double hitRate,
            long evictionCount,
            long size
    ) {}

    /**
     * 멀티 레벨 캐시 조회
     */
    public List<StoreDistanceResult> get(Long poiId, int distance) {
        String key = generateKey(poiId, distance);

        List<StoreDistanceResult> l1Result = l1Cache.getIfPresent(key);
        if (Objects.nonNull(l1Result) && !l1Result.isEmpty()) {
            log.info("L1 cache hit for {}", key);
            cacheMetricsService.recordHit(poiId, false);
            return l1Result;
        }

        if (l2Cache.hasCache(poiId, distance)) {
            List<StoreDistanceResult> l2Result = l2Cache.getCache(poiId, distance);

            if (Objects.nonNull(l2Result) && !l2Result.isEmpty()) {
                if (accessTrackingService.isHotspot(poiId)) {
                    l1Cache.put(key, l2Result);
                    log.info("L2 cache hit for HOTSPOT {}, promoted to L1", key);
                } else {
                    log.debug("L2 cache hit for normal POI {}, not promoted", key);
                }
                boolean isStale = cacheMetadataService.isStale(poiId, distance);
                cacheMetricsService.recordHit(poiId, isStale);
                log.info("L2 cache hit for {}, promoted to L1", key);

                return l2Result;
            }
        }

        log.info("Cache miss for {}", key);
        cacheMetricsService.recordMiss(poiId);
        return Collections.emptyList();
    }

    /**
     * 멀티 레벨 캐시 저장
     */
    public void put(Long poiId, int distance, List<StoreDistanceResult> data) {
        String key = generateKey(poiId, distance);

        if (accessTrackingService.isHotspot(poiId)) {
            l1Cache.put(key, data);
            log.info("Saved HOTSPOT to L1 and L2 cache: {}", key);
        } else {
            log.info("Saved to L2 cache only (non-hotspot): {}", key);
        }

        l2Cache.saveCache(poiId, distance, data);
    }

    /**
     * 멀티 레벨 캐시 무효화
     */
    public void evict(Long poiId) {
        // L1 캐시에서 해당 POI의 모든 거리 삭제
        l1Cache.asMap().keySet().removeIf(key -> key.startsWith("poi:" + poiId));

        // L2 캐시 삭제
        l2Cache.deleteCache(poiId);

        log.info("Evicted from all cache levels: POI {}", poiId);
    }

    /**
     * L1 캐시 통계 조회
     */
    public CacheStats getL1Stats() {
        var stats = l1Cache.stats();
        return new CacheStats(
                stats.hitCount(),
                stats.missCount(),
                stats.hitRate(),
                stats.evictionCount(),
                l1Cache.estimatedSize()
        );
    }

    public Map<String, List<StoreDistanceResult>> getL1Contents() {
        return new HashMap<>(l1Cache.asMap()); // 스냅샷 생성하여 반환
    }

    private String generateKey(Long poiId, int distance) {
        return "poi:" + poiId + ":" + distance;
    }
}
