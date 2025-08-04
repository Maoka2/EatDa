package com.domain.review.service;

import com.domain.review.entity.Poi;
import com.domain.review.entity.Store;
import com.domain.review.repository.PoiDistanceRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class PoiStoreDistanceService {

    private final PoiRepository poiRepository;
    private final PoiDistanceRepository poiDistanceRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final GeohashService geohashService;
    private final HaversineCalculator haversineCalculator;

    @Value("${app.poi.distance.max-radius:1000}")
    private int maxDistanceRadius;

    @Value("${app.poi.distance.geohash-precision:5}")
    private int geohashPrecision;

    @Transactional
    public void calculateAndSaveDistance(final Store store) {
        log.info("Starting distance calculation for store: {} at ({}, {})",
                store.getId(), store.getLatitude(), store.getLongitude());

        try {
            // 1. 가게 위치의 geohash 계산
            String storeGeohash = geohashService.encode(
                    store.getLatitude(),
                    store.getLongitude(),
                    geohashPrecision
            );

            List<Poi> nearbyPois = findNearbyPoisByGeohash(
                    storeGeohash,
                    store.getLatitude(),
                    store.getLongitude()
            );

            log.debug("Found {} nearby POIs using geohash: {}", nearbyPois.size(), storeGeohash);

            // 3. 각 POI와의 거리 계산 및 필터링
            List<PoiDistance> distances = calculateDistances(store, nearbyPois);

            // 4. DB에 거리 정보 저장
            saveDistances(distances);

            // 5. Redis 캐시 업데이트
            updateRedisCache(distances);

            log.info("Distance calculation completed. Saved {} POI-Store distances", distances.size());

        } catch (Exception e) {
            log.error("Error calculating distances for store: {}", store.getId(), e);
            throw new RuntimeException("거리 계산 중 오류 발생", e);
        }
    }

    /**
     * Geohash를 활용한 주변 POI 조회
     */
    private List<Poi> findNearbyPoisByGeohash(final String centerGeohash,
                                              final double centerLat,
                                              final double centerLon) {
        // Geohash 주변 8개 이웃 포함하여 조회
        Set<String> geohashPrefixes = geohashService.getNeighbors(centerGeohash);
        geohashPrefixes.add(centerGeohash);

        List<Poi> allNearbyPois = new ArrayList<>();

        for (String prefix : geohashPrefixes) {
            // precision을 줄여서 더 넓은 범위 검색 (예: 5자리 → 4자리)
            String searchPrefix = prefix.substring(0, Math.max(1, prefix.length() - 1));
            List<Poi> pois = poiRepository.findByGeohashStartingWith(searchPrefix);
            allNearbyPois.addAll(pois);
        }

        // 중복 제거 및 실제 거리로 필터링
        return allNearbyPois.stream()
                .distinct()
                .filter(poi -> {
                    int distance = haversineCalculator.calculate(
                            centerLat, centerLon,
                            poi.getLatitude(), poi.getLongitude()
                    );
                    return distance <= maxDistanceRadius;
                })
                .collect(Collectors.toList());
    }
}
