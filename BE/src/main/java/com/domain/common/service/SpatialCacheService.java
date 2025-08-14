package com.domain.common.service;

import com.domain.review.dto.response.StoreDistanceResult;
import com.global.redis.constants.RedisConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpatialCacheService {

    private static final String CACHE_KEY_PATTERN = "poi:%d:stores:%dm";
    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * 특정 거리 밴드의 캐시 존재 여부 확인
     */
    public boolean hasCache(Long poiId, int distance) {
        String cacheKey = generateCacheKey(poiId, distance);

        Boolean exists = redisTemplate.hasKey(cacheKey);
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

        redisTemplate.expire(cacheKey, RedisConstants.CACHE_POI_STORE_DISTANCE_TTL);

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
}
