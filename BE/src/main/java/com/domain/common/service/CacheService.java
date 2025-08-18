package com.domain.common.service;

import com.domain.common.entity.Poi;
import com.domain.common.repository.PoiRepository;
import com.domain.review.dto.response.StoreDistanceResult;
import com.domain.store.event.StoreCreatedEvent;
import com.global.constants.SearchDistance;
import com.global.redis.constants.RedisConstants;
import com.global.utils.geo.H3SearchStrategy;
import com.global.utils.geo.H3Utils;
import com.global.utils.geo.HaversineCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CacheService {

    private static final String CACHE_KEY_PATTERN = "poi:%d:stores:%dm";
    private static final int MAX_AFFECTED_DISTANCE = 2000;

    private final RedisTemplate<String, Object> redisTemplate;
    private final H3Utils h3Utils;
    private final PoiRepository poiRepository;
    private final HaversineCalculator haversineCalculator;
    private final PoiAccessTrackingService poiAccessTrackingService;
    private final CacheMetadataService metadataService;
    private final DynamicThresholdService thresholdService;

    /**
     * 특정 거리 밴드의 캐시 존재 여부 확인
     */
    public boolean hasCache(Long poiId, int distance) {
        String cacheKey = generateCacheKey(poiId, distance);
        log.info("Cache key: {}", cacheKey);

        Boolean exists = redisTemplate.hasKey(cacheKey);
        log.info("Cache exists: {}", exists);
        if (exists) {
            Long size = redisTemplate.opsForZSet().size(cacheKey);
            return size != null && size > 0;
        }

        return false;
    }

    /**
     * 특정 거리 밴드의 캐시 조회
     */
    public List<StoreDistanceResult> getCache(Long poiId, int distance) {
        String cacheKey = generateCacheKey(poiId, distance);

        Set<ZSetOperations.TypedTuple<Object>> cachedData =
                redisTemplate.opsForZSet().rangeWithScores(cacheKey, 0, -1);

        if (cachedData == null || cachedData.isEmpty()) {
            return new ArrayList<>();
        }

        return convertToStoreDistanceResults(cachedData);
    }

    /**
     * 특정 거리 밴드의 Store 목록을 캐시에 저장
     */
    public void saveCache(Long poiId, int distance, List<StoreDistanceResult> stores) {
        if (stores == null || stores.isEmpty()) {
            log.info("No stores to cache for POI {} at {}m band", poiId, distance);
            return;
        }

        String cacheKey = generateCacheKey(poiId, distance);

        // 기존 캐시 삭제 (덮어쓰기)
        redisTemplate.delete(cacheKey);

        stores.forEach(store ->
                redisTemplate.opsForZSet().add(
                        cacheKey,
                        store.storeId(),
                        store.distance()
                )
        );

        Duration dynamicTtl = Duration.ofMinutes(thresholdService.getCacheTtlMinutes());
        redisTemplate.expire(cacheKey, dynamicTtl);

        log.info("Cached {} stores for POI {} at {}m band", stores.size(), poiId, distance);
    }

    /**
     * 특정 POI의 모든 거리 밴드 캐시 삭제
     */
    public void deleteCache(Long poiId) {
        Set<String> keys = redisTemplate.keys(String.format("poi:%d:stores:*", poiId));
        if (!keys.isEmpty()) {
            redisTemplate.delete(keys);
            log.debug("Evicted {} cache entries for POI {}", keys.size(), poiId);
        }
    }

    // 연결된 스레드 풀에서 실행
    @Async
    // 가게 생성과 캐시 관리 서비스 분리
    @EventListener
    @Transactional(readOnly = true)
    public void handleStoreCreated(StoreCreatedEvent event) {
        log.info("Processing cache invalidation for new store: {} at ({}, {})",
                event.storeId(), event.latitude(), event.longitude());

        try {
            // 영향받는 POI들 찾기
            List<Poi> affectedPois = findAffectedPois(
                    event.latitude(),
                    event.longitude()
            );

            int immediateInvalidations = 0;
            int staleMarkings = 0;

            for (Poi poi : affectedPois) {
                if (poiAccessTrackingService.isHotspot(poi.getId())) {
                    // 핫스팟은 자주 사용하므로 가용상을 보장하기 위해 stale 마킹만 함
                    markCacheAsStale(poi.getId(), "new_store_added");
                    staleMarkings++;
                    log.debug("Marked hotspot POI {} as stale", poi.getId());
                } else {
                    // 일반 POI: 즉시 삭제
                    deleteCache(poi.getId());
                    immediateInvalidations++;
                    log.debug("Invalidated cache for normal POI {}", poi.getId());
                }
            }

            log.info("Cache invalidation completed - Immediate: {}, Stale marked: {}, Total POIs: {}",
                    immediateInvalidations, staleMarkings, affectedPois.size());

        } catch (Exception e) {
            log.error("Failed to invalidate cache for store {}: {}",
                    event.storeId(), e.getMessage(), e);
        }
    }

    /**
     * 새 가게 위치에서 영향받는 POI들 찾기
     */
    private List<Poi> findAffectedPois(Double storeLatitude, Double storeLongitude) {
        H3SearchStrategy.Strategy strategy = H3SearchStrategy.determineStrategy(MAX_AFFECTED_DISTANCE);
        long centerH3 = h3Utils.encode(storeLatitude, storeLongitude, strategy.resolution());

        List<Long> h3Cells = h3Utils.getKRing(centerH3, strategy.kRing());

        List<Poi> candidatePois = poiRepository.findByH3Index7In(h3Cells);

        return candidatePois.stream()
                .filter(poi -> {
                    double distance = haversineCalculator.calculate(
                            poi.getLatitude(), poi.getLongitude(),
                            storeLatitude, storeLongitude
                    );
                    return distance <= MAX_AFFECTED_DISTANCE;
                })
                .toList();
    }

    private String generateCacheKey(Long poiId, int distance) {
        return String.format(CACHE_KEY_PATTERN, poiId, distance);
    }

    private List<StoreDistanceResult> convertToStoreDistanceResults(
            Set<ZSetOperations.TypedTuple<Object>> cachedData) {

        return cachedData.stream()
                .map(tuple -> StoreDistanceResult.builder()
                        .storeId(Long.valueOf(Objects.requireNonNull(tuple.getValue()).toString()))
                        .distance(Objects.requireNonNull(tuple.getScore()).intValue())
                        .build())
                .sorted(Comparator.comparingInt(StoreDistanceResult::distance))
                .collect(Collectors.toList());
    }

    /**
     * 모든 거리 밴드의 캐시를 stale로 마킹
     */
    private void markCacheAsStale(Long poiId, String reason) {
        for (SearchDistance distance : SearchDistance.values()) {
            if (hasCache(poiId, distance.getMeters())) {
                metadataService.markAsStale(poiId, distance.getMeters(), reason);
            }
        }
    }
}
