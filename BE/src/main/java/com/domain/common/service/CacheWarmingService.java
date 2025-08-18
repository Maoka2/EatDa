package com.domain.common.service;

import com.domain.common.entity.Poi;
import com.domain.common.repository.PoiRepository;
import com.global.constants.SearchDistance;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CacheWarmingService {

    private final PoiRepository poiRepository;
    private final SpatialSearchService spatialSearchService;
    private final PoiAccessTrackingService accessTrackingService;

    /**
     * 출근 시간 전 캐시 예열 (오전 7시)
     */
    @Scheduled(cron = "0 0 7 * * MON-FRI")
    public void warmCacheForMorningRush() {
        log.info("Starting morning rush cache warming");
        warmCacheForAreas(List.of("신논현역", "홍대입구역", "명동역"));
    }

    /**
     * 점심 시간 전 캐시 예열 (오전 11시 30분)
     */
    @Scheduled(cron = "0 30 11 * * MON-FRI")
    public void warmCacheForLunch() {
        log.info("Starting lunch time cache warming");
        warmCacheForAreas(List.of("종로3가역", "종로5가역", "신촌역"));
    }

    /**
     * 저녁 시간 전 캐시 예열 (오후 5시 30분)
     */
    @Scheduled(cron = "0 30 17 * * *")
    public void warmCacheForDinner() {
        log.info("Starting dinner time cache warming");
        warmCacheForAreas(List.of("신논현역", "홍대입구역", "명동역", "종로3가역", "종로5가역", "신촌역"));
    }

    @Scheduled(fixedDelay = 1800000) // 30분
    public void warmHotspotCaches() {
        log.info("Warming hotspot POI caches");

        // 핫스팟 POI들 조회
        List<Poi> hotspotPois = poiRepository.findAll().stream()
                .filter(poi -> accessTrackingService.isHotspot(poi.getId()))
                .limit(10) // 상위 50개만
                .toList();

        int warmedCount = 0;
        for (Poi poi : hotspotPois) {
            for (SearchDistance distance : SearchDistance.values()) {
                try {
                    spatialSearchService.getNearbyStoresWithDistance(poi.getId(), distance.getMeters());
                    warmedCount++;
                } catch (Exception e) {
                    log.error("Failed to warm cache for POI {} at {}m: {}",
                            poi.getId(), distance, e.getMessage());
                }
            }
        }

        log.info("Warmed {} hotspot caches", warmedCount);
    }


    private void warmCacheForAreas(List<String> areas) {
        for (String area : areas) {
            try {
                List<Poi> pois = poiRepository.findByName(area);

                for (Poi poi : pois) {
                    for (SearchDistance distance : SearchDistance.values()) {
                        spatialSearchService.getNearbyStoresWithDistance(poi.getId(), distance.getMeters());
                    }
                }

                log.info("Warmed cache for area: {}", area);
            } catch (Exception e) {
                log.error("Failed to warm cache for area {}: {}", area, e.getMessage());
            }
        }
    }
}
