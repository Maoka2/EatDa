package com.domain.common.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class PoiAccessTrackingService {

    private final RedisTemplate<String, Object> redisTemplate;

    // redis 관련 key랑 상수들은 redisConstants로 이관 가능
    // 접근 횟수 카운트 - poi:access:count:123, 150 (poi 123번에 조회횟수 150)
    private static final String ACCESS_COUNT_KEY = "poi:access:count:";
    // 핫스팟 상태 - poi:hotspot:123, true (poi 123번의 핫스팟 유무)
    private static final String HOTSPOT_STATUS_KEY = "poi:hotspot:";
    // 마지막 접근 시간 - poi:last_access:123, "2023-10-05" (poi 123번에 마지막 조회 시간)
    private static final String LAST_ACCESS_KEY = "poi:last_access:";

    // 핫스팟 판정 기준
    private static final int HOTSPOT_THRESHOLD_PER_HOUR = 100;
    private static final Duration ACCESS_COUNT_TTL = Duration.ofHours(1);
    private static final Duration HOTSPOT_STATUS_TTL = Duration.ofHours(24);

    // 각 POI의 시간당 조회 횟수 추적
    public void recordAccess(Long poiId) {
        try {
            String countKey = ACCESS_COUNT_KEY + poiId;
            String lastAccessKey = LAST_ACCESS_KEY + poiId;

            // redis의 value값에 +1하고 +1한 값을 count에 할당
            Long count = redisTemplate.opsForValue().increment(countKey);

            // 첫 접근 시에만 TTL(1시간)으로 설정
            if (count == 1) {
                redisTemplate.expire(countKey, ACCESS_COUNT_TTL);
            }

            // 해당 poi의 lastAccess 시간 갱신
            redisTemplate.opsForValue().set(lastAccessKey, LocalDateTime.now().toString(), Duration.ofDays(7));

            // 임계값 도달 시 자동으로 핫스팟 승격
            if (count >= HOTSPOT_THRESHOLD_PER_HOUR) {
                promoteToHotspot(poiId);
            }

            log.debug("Recorded access for POI {}, count: {}", poiId, count);
        } catch (Exception e) {
            log.error("Error recording access for POI {}", poiId, e);
        }
    }

    /**
     * POI가 핫스팟인지 확인
     */
    public boolean isHotspot(Long poiId) {
        String hotspotKey = HOTSPOT_STATUS_KEY + poiId;
        String value = (String) redisTemplate.opsForValue().get(hotspotKey);
        return "true".equals(value);
    }

    /**
     * 현재 접근 횟수 조회
     */
    public int getCurrentAccessCount(Long poiId) {
        String countKey = ACCESS_COUNT_KEY + poiId;
        Integer count = (Integer) redisTemplate.opsForValue().get(countKey);
        return count != null ? count : 0;
    }

    /**
     * 마지막 접근 시간 조회
     */
    public LocalDateTime getLastAccessTime(Long poiId) {
        String lastAccessKey = LAST_ACCESS_KEY + poiId;
        String timeStr = (String) redisTemplate.opsForValue().get(lastAccessKey);
        return timeStr != null ? LocalDateTime.parse(timeStr) : null;
    }

    private void promoteToHotspot(Long poiId) {
        String hotspotKey = HOTSPOT_STATUS_KEY + poiId;
        redisTemplate.opsForValue().set(hotspotKey, "true", HOTSPOT_STATUS_TTL);
        log.info("POI {} promoted to hotspot", poiId);
    }
}
