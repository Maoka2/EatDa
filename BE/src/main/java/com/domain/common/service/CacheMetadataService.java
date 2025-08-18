package com.domain.common.service;

import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CacheMetadataService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final DynamicThresholdService thresholdService;

    // metadata - poi:cache:metadata:123:500 (poi123에 500m 캐시의 메타데이터 저장)
    private static final String METADATA_KEY_PREFIX = "poi:cache:metadata:";
    private static final Duration METADATA_TTL = Duration.ofDays(7);

    @Builder
    public record CacheMetadata(
            LocalDateTime lastUpdated, // lastUpdated: 캐시 최종 갱신 시간 (ISO 8601 형식)
            boolean isStale, // isStale: 캐시 유효성 상태 (true=만료됨, false=유효함)
            String staleReason, // staleReason: 만료 사유 (옵션)
            LocalDateTime scheduledRefresh, // scheduledRefresh: 예정된 재갱신 시간
            int version // 캐시 버전
    ) {
        // fresh : 서버에게 최신의 데이터를 받은 상태
        public static CacheMetadata fresh() {
            return CacheMetadata.builder()
                    .lastUpdated(LocalDateTime.now())
                    .isStale(false)
                    .version(1)
                    .build();
        }

        // stale : 저장한 데이터가 더이상 최신이 아님을 뜻하는 상태
        public static CacheMetadata stale(String reason) {
            return CacheMetadata.builder()
                    .lastUpdated(LocalDateTime.now())
                    .isStale(true)
                    .staleReason(reason)
                    .scheduledRefresh(LocalDateTime.now().plusMinutes(5))
                    .version(1)
                    .build();
        }
    }

    public void saveMetadata(Long poiId, int distance, CacheMetadata metadata) {
        String key = generateKey(poiId, distance);
        // 자바 객체를 redis hash 맵으로 변환
        Map<String, Object> map = convertToMap(metadata);
        // 메타데이터를 Redis Hash로 저장
        redisTemplate.opsForHash().putAll(key, map);
        // 자동 만료 정책 적용
        redisTemplate.expire(key, METADATA_TTL);

        log.debug("Saved cache metadata for POI {} at {}m", poiId, distance);
    }

    public CacheMetadata getMetadata(Long poiId, int distance) {
        String key = generateKey(poiId, distance);
        Map<Object, Object> map = redisTemplate.opsForHash().entries(key);

        if (map.isEmpty()) return null;

        return convertToMetadata(map);
    }

    public void markAsStale(Long poiId, int distance, String reason) {
        // 기존 메타데이터 조회
        CacheMetadata metadata = getMetadata(poiId, distance);
        if (metadata == null) return;

        // fresh에서 stale 상태로 변한 메타데이터 생성
        CacheMetadata staleMetadata = CacheMetadata.builder()
                .lastUpdated(LocalDateTime.now())
                .isStale(true)
                .staleReason(reason)
                .scheduledRefresh(LocalDateTime.now().plusMinutes(5))
                .version(metadata.version())
                .build();

        // 갱신된 메타 데이터 저장
        saveMetadata(poiId, distance, staleMetadata);
        log.info("Marked cache as stale for POI {} at {}m: {}", poiId, distance, reason);
    }

    public boolean isStale(Long poiId, int distance) {
        CacheMetadata metadata = getMetadata(poiId, distance);
        return metadata != null && metadata.isStale();
    }

    /**
     * 캐시가 너무 오래되었는지 확인
     */
    public boolean isTooStale(Long poiId, int distance) {
        CacheMetadata metadata = getMetadata(poiId, distance);

        if (metadata == null || !metadata.isStale()) {
            return false;
        }

        // Stale 상태가 너무 오래된 것이라 판단 x2배인 이유는 무분별한 갱신을 막기 위함
        int tooStaleMinutes = thresholdService.getCacheTtlMinutes() * 2;
        Duration staleDuration = Duration.between(metadata.lastUpdated(), LocalDateTime.now());

        return staleDuration.toMinutes() > tooStaleMinutes;
    }

    private String generateKey(Long poiId, int distance) {
        return METADATA_KEY_PREFIX + poiId + ":" + distance;
    }

    private Map<String, Object> convertToMap(CacheMetadata metadata) {
        Map<String, Object> map = new HashMap<>();
        map.put("lastUpdated", metadata.lastUpdated().toString());
        map.put("isStale", String.valueOf(metadata.isStale()));
        map.put("staleReason", metadata.staleReason() != null ? metadata.staleReason() : "");
        map.put("scheduledRefresh", metadata.scheduledRefresh() != null ?
                metadata.scheduledRefresh().toString() : "");
        map.put("version", String.valueOf(metadata.version()));
        return map;
    }

    private CacheMetadata convertToMetadata(Map<Object, Object> map) {
        return CacheMetadata.builder()
                .lastUpdated(LocalDateTime.parse((String) map.get("lastUpdated")))
                .isStale(Boolean.parseBoolean((String) map.get("isStale")))
                .staleReason(!"".equals(map.get("staleReason")) ? (String) map.get("staleReason") : null)
                .scheduledRefresh(!"".equals(map.get("scheduledRefresh")) ?
                        LocalDateTime.parse((String) map.get("scheduledRefresh")) : null)
                .version(Integer.parseInt((String) map.get("version")))
                .build();
    }
}
