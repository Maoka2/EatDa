package com.domain.common.service;

import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.Serializable;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
public class CacheMetricsService {

    private final RedisTemplate<String, Object> redisTemplate;

    private final Map<String, AtomicLong> hitCounters = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> missCounters = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> staleServedCounters = new ConcurrentHashMap<>();

    private static final String METRICS_KEY_PREFIX = "cache:metrics:";

    @Builder
    public record CacheMetrics(
            long hits,
            long misses,
            long staleServed,
            double hitRate,
            double missRate,
            double staleRate,
            LocalDateTime timestamp
    ) implements Serializable {
        public static CacheMetrics calculate(long hits, long misses, long staleServed) {
            long total = hits + misses;
            double hitRate = total > 0 ? (double) hits / total * 100 : 0;
            double missRate = total > 0 ? (double) misses / total * 100 : 0;
            double staleRate = hits > 0 ? (double) staleServed / hits * 100 : 0;

            return CacheMetrics.builder()
                    .hits(hits)
                    .misses(misses)
                    .staleServed(staleServed)
                    .hitRate(hitRate)
                    .missRate(missRate)
                    .staleRate(staleRate)
                    .timestamp(LocalDateTime.now())
                    .build();
        }
    }

    public void recordHit(Long poiId, boolean isStale) {
        String key = "poi:" + poiId;
        hitCounters.computeIfAbsent(key, k -> new AtomicLong()).incrementAndGet();

        if (isStale) {
            staleServedCounters.computeIfAbsent(key, k -> new AtomicLong()).incrementAndGet();
        }
    }

    public void recordMiss(Long poiId) {
        String key = "poi:" + poiId;
        missCounters.computeIfAbsent(key, k -> new AtomicLong()).incrementAndGet();
    }

    public CacheMetrics getMetrics(Long poiId) {
        String key = "poi:" + poiId;
        long hits = hitCounters.getOrDefault(key, new AtomicLong()).get();
        long misses = missCounters.getOrDefault(key, new AtomicLong()).get();
        long staleServed = staleServedCounters.getOrDefault(key, new AtomicLong()).get();

        return CacheMetrics.calculate(hits, misses, staleServed);
    }

    public CacheMetrics getSystemMetrics() {
        long totalHits = hitCounters.values().stream()
                .mapToLong(AtomicLong::get).sum();
        long totalMisses = missCounters.values().stream()
                .mapToLong(AtomicLong::get).sum();
        long totalStaleServed = staleServedCounters.values().stream()
                .mapToLong(AtomicLong::get).sum();

        return CacheMetrics.calculate(totalHits, totalMisses, totalStaleServed);
    }

    @Scheduled(fixedDelay = 60000)
    public void updateCurrentMetrics() {
        CacheMetrics metrics = getSystemMetrics();
        redisTemplate.opsForValue().set(METRICS_KEY_PREFIX + "current", metrics);
    }

    @Scheduled(fixedDelay = 3600000) // 1시간마다
    public void persistMetrics() {
        CacheMetrics metrics = getSystemMetrics();

        Map<String, Object> metricsMap = Map.of(
                "hits", metrics.hits(),
                "misses", metrics.misses(),
                "hitRate", metrics.hitRate(),
                "timestamp", LocalDateTime.now().toString()
        );

        redisTemplate.opsForStream().add(
                StreamRecords.newRecord()
                        .in(METRICS_KEY_PREFIX + "stream")
                        .ofMap(metricsMap)
        );

        // 오래된 항목 자동 삭제 (최근 10개만)
        redisTemplate.opsForStream().trim(METRICS_KEY_PREFIX + "stream", 10);
    }
}

