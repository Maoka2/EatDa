package com.domain.common.controller;

import com.domain.common.service.*;
import com.domain.review.dto.response.StoreDistanceResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/cache")
@RequiredArgsConstructor
public class CacheMonitoringController {

    private final CacheMetricsService metricsService;
    private final DynamicThresholdService thresholdService;
    private final MultiLevelCacheService multiLevelCache;
    private final PoiAccessTrackingService accessTrackingService;

    /**
     * 시스템 전체 캐시 메트릭 조회
     */
    @GetMapping("/metrics")
    public ResponseEntity<?> getSystemMetrics() {
        return ResponseEntity.ok(Map.of(
                "system", metricsService.getSystemMetrics(),
                "l1Cache", multiLevelCache.getL1Stats(),
                "thresholds", Map.of(
                        "hotspotThreshold", thresholdService.getHotspotThreshold(),
                        "cacheTtlMinutes", thresholdService.getCacheTtlMinutes()
                )
        ));
    }

    /**
     * POI별 캐시 메트릭 조회
     */
    @GetMapping("/metrics/poi/{poiId}")
    public ResponseEntity<?> getPoiMetrics(@PathVariable Long poiId) {
        return ResponseEntity.ok(Map.of(
                "metrics", metricsService.getMetrics(poiId),
                "isHotspot", accessTrackingService.isHotspot(poiId),
                "accessCount", accessTrackingService.getCurrentAccessCount(poiId),
                "lastAccess", accessTrackingService.getLastAccessTime(poiId)
        ));
    }

    @GetMapping("/l1/contents")
    public ResponseEntity<Map<String, List<StoreDistanceResult>>> getL1Contents() {
        return ResponseEntity.ok(multiLevelCache.getL1Contents());
    }
}