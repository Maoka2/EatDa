package com.domain.common.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class DynamicThresholdService {

    private final CacheMetricsService metricsService;
    private final SystemMetricsService systemMetricsService;

    // 동적 임계값
    private volatile int hotspotThreshold = 100;
    private volatile int cacheTtlMinutes = 30;

    private static final double CPU_HIGH_THRESHOLD = 0.8;
    private static final double CPU_LOW_THRESHOLD = 0.3;
    private static final double MEMORY_HIGH_THRESHOLD = 0.85;

    private static final double MIN_HIT_RATE = 70.0;
    private static final double MAX_MISS_RATE = 30.0;
    private static final double MAX_STALE_RATE = 20.0;

    @Scheduled(fixedDelay = 300000)
    public void adjustThreshold() {
        try {
            // 여기는 실제 cpu 사용률
            double cpuUsage = systemMetricsService.getCpuUsage();
            // 여기는 jvm 메모리 사용률
            double memoryUsage = systemMetricsService.getMemoryUsage();

            CacheMetricsService.CacheMetrics metrics = metricsService.getSystemMetrics();

            if (cpuUsage > CPU_HIGH_THRESHOLD) {
                decreaseHotspotThreshold();
                log.info("High CPU usage ({}%), decreased hotspot threshold to {}",
                        cpuUsage * 100, hotspotThreshold);
            } else if  (cpuUsage < CPU_LOW_THRESHOLD) {
                increaseHotspotThreshold();
                log.info("Low CPU usage ({}%), increased hotspot threshold to {}",
                        cpuUsage * 100, hotspotThreshold);
            }

            if (memoryUsage > MEMORY_HIGH_THRESHOLD) {
                decreaseCacheTtl();
                log.info("Low CPU usage ({}%), increased hotspot threshold to {}",
                        cpuUsage * 100, hotspotThreshold);
            }

            if (metrics.hitRate() < MIN_HIT_RATE) {
                increaseCacheTtl();
                log.info("Low hit rate ({}%), increased cache TTL to {} minutes",
                        metrics.hitRate(), cacheTtlMinutes);
            }

            if (metrics.staleRate() > MAX_STALE_RATE) {
                // Stale 제공률 높음 - 갱신 주기 단축
                decreaseHotspotThreshold();
                log.info("High stale rate ({}%), adjusted hotspot threshold to {}",
                        metrics.staleRate(), hotspotThreshold);
            }
        } catch (Exception e) {
            log.error("Failed to adjust thresholds: {}", e.getMessage());
        }
    }

    private void decreaseHotspotThreshold() {
        hotspotThreshold = Math.max(50, hotspotThreshold - 10);
    }

    private void increaseHotspotThreshold() {
        hotspotThreshold = Math.min(200, hotspotThreshold + 10);
    }

    private void decreaseCacheTtl() {
        cacheTtlMinutes = Math.max(5, cacheTtlMinutes - 5);
    }

    private void increaseCacheTtl() {
        cacheTtlMinutes = Math.min(60, cacheTtlMinutes + 5);
    }

    public int getHotspotThreshold() {
        return hotspotThreshold;
    }

    public int getCacheTtlMinutes() {
        return cacheTtlMinutes;
    }
}
