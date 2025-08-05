package com.domain.review.service;

import com.domain.review.dto.response.StoreDistanceResult;
import com.domain.review.entity.Poi;
import com.domain.review.entity.PoiDistance;
import com.domain.review.entity.Store;
import com.domain.review.repository.PoiDistanceRepository;
import com.domain.review.repository.PoiRepository;
import com.domain.review.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PoiStoreDistanceService {

    private final H3Service h3Service;
    private final PoiRepository poiRepository;
    private final StoreRepository storeRepository;
    private final HaversineCalculator haversineCalculator;

// ===== Public APIs =====

    /**
     * 1. 사용자 위치에서 가장 가까운 POI 찾기
     */
    public Poi findNearestPoi(double userLat, double userLon);

    /**
     * 2. POI 기준으로 거리별 Store 목록 조회 (메인 API)
     * - Redis 캐시 우선 확인
     * - 캐시 미스 시 H3 기반 실시간 검색
     */
    public List<StoreDistanceResult> getNearbyStores(Long poiId, int requestedDistance);

    /**
     * 3. Store 등록/업데이트 시 캐시 갱신 (선택적)
     * - 자주 조회되는 POI들에 대해서만 미리 계산
     */
    public void updateCacheForStore(Store store);

    /**
     * 4. Store 삭제 시 캐시에서 제거
     */
    public void removeStoreFromCache(Long storeId);

    /**
     * H3를 사용해 사용자 주변 POI들 찾기
     */
    private List<Poi> findNearbyPoisByH3(double lat, double lon, int maxDistance) {
        H3SearchStrategy strategy = determineH3Strategy(maxDistance);
        log.debug("Finding POIs within {}m using H3 strategy: resolution={}, kRing={}",
                maxDistance, strategy.resolution(), strategy.kRing());

        long centerH3 = h3Service.encode(lat, lon, strategy.resolution());

        List<Long> h3Cells = h3Service.getKRing(centerH3, strategy.kRing());

        List<Poi> candidatePois = switch (strategy.resolution()) {
            case 7 -> poiRepository.findByH3Index7In(h3Cells);
            case 8 -> poiRepository.findByH3Index8In(h3Cells);
            case 9 -> poiRepository.findByH3Index9In(h3Cells);
            case 10 -> poiRepository.findByH3Index10In(h3Cells);
            default -> throw new IllegalArgumentException("Unsupported H3 resolution: " + strategy.resolution());
        };

        log.debug("Found {} candidate POIs from H3 cells", candidatePois.size());

        // 5. 실제 거리 계산으로 정확한 필터링 및 정렬
        return candidatePois.stream()
                .map(poi -> {
                    int distance = haversineCalculator.calculate(lat, lon, poi.getLatitude(), poi.getLongitude());
                    return Map.entry(poi, distance);
                })
                .filter(entry -> entry.getValue() <= maxDistance)
                .sorted(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    /**
     * H3를 사용해 POI 주변 Store들 찾기
     *
     * @param lat 중심점(POI) 위도
     * @param lon 중심점(POI) 경도
     * @param searchDistance 검색 거리 (미터)
     * @return 거리 내의 Store 목록
     */
    private List<Store> findNearbyStoresByH3(double lat, double lon, int searchDistance) {
        // 1. 거리에 따른 H3 검색 전략 결정
        H3SearchStrategy strategy = determineH3Strategy(searchDistance);
        log.debug("Finding Stores within {}m using H3 strategy: resolution={}, kRing={}",
                searchDistance, strategy.resolution(), strategy.kRing());

        // 2. 중심점의 H3 인덱스 계산
        long centerH3 = h3Service.encode(lat, lon, strategy.resolution());

        // 3. k-ring으로 주변 셀들의 H3 인덱스 가져오기
        List<Long> h3Cells = h3Service.getKRing(centerH3, strategy.kRing());

        // 4. 해상도에 따라 적절한 컬럼으로 Store 조회
        List<Store> candidateStores = switch (strategy.resolution()) {
            case 7 -> storeRepository.findByH3Index7In(h3Cells);
            case 8 -> storeRepository.findByH3Index8In(h3Cells);
            case 9 -> storeRepository.findByH3Index9In(h3Cells);
            case 10 -> storeRepository.findByH3Index10In(h3Cells);
            default -> throw new IllegalArgumentException("Unsupported H3 resolution: " + strategy.resolution());
        };

        log.debug("Found {} candidate Stores from H3 cells", candidateStores.size());

        // 5. 실제 거리 계산으로 정확한 필터링
        return candidateStores.stream()
                .filter(store -> {
                    int distance = haversineCalculator.calculate(
                            lat, lon,
                            store.getLatitude(), store.getLongitude()
                    );
                    return distance <= searchDistance;
                })
                .collect(Collectors.toList());
    }

    /**
     * 거리에 따른 H3 검색 전략 결정
     */
    private H3SearchStrategy determineH3Strategy(int distanceMeters) {
        if (distanceMeters <= 300) {
            // Res 10, k=2: 중심에서 약 76m × 2.5 ≈ 190m 커버
            // 300m를 커버하려면 k=3~4 필요
            return new H3SearchStrategy(10, 4);
        } else if (distanceMeters <= 500) {
            // Res 9, k=2: 중심에서 약 201m × 2.5 ≈ 502m 커버
            return new H3SearchStrategy(9, 2);
        } else if (distanceMeters <= 700) {
            // Res 9, k=3: 중심에서 약 201m × 3.5 ≈ 703m 커버
            return new H3SearchStrategy(9, 3);
        } else if (distanceMeters <= 1000) {
            // Res 8, k=2: 중심에서 약 531m × 2 ≈ 1062m 커버
            return new H3SearchStrategy(8, 2);
        } else {
            // Res 8, k=3: 중심에서 약 531m × 3.5 ≈ 1858m 커버
            // 또는 Res 7 사용 고려
            return new H3SearchStrategy(8, 4);   // 2000m까지 안전하게 커버
        }
    }

    /**
     * 실제 거리 계산 및 필터링
     */
    /**
     * 실제 거리 계산 및 필터링
     *
     * @param centerLat 중심점(POI) 위도
     * @param centerLon 중심점(POI) 경도
     * @param stores H3로 필터링된 Store 목록
     * @param maxDistance 최대 거리 제한 (미터)
     * @return 거리 정보를 포함한 Store 결과 목록 (거리순 정렬)
     */
    private List<StoreDistanceResult> calculateAndFilterDistances(
            double centerLat, double centerLon, List<Store> stores, int maxDistance) {

        log.debug("Calculating distances for {} stores within {}m", stores.size(), maxDistance);

        return stores.stream()
                // 1. 각 Store와의 거리 계산
                .map(store -> {
                    int distance = haversineCalculator.calculate(
                            centerLat, centerLon,
                            store.getLatitude(), store.getLongitude()
                    );

                    return StoreDistanceResult.builder()
                            .storeId(store.getId())
                            .distance(distance)
                            .build();
                })
                // 2. 요청된 거리 내의 Store만 필터링
                .filter(result -> result.distance() <= maxDistance)
                // 3. 거리순으로 정렬 (가까운 순)
                .sorted(Comparator.comparingInt(StoreDistanceResult::distance))
                // 4. 결과 수집
                .collect(Collectors.toList());
    }

    /**
     * Redis 캐시 업데이트
     */
    private void updateRedisCache(Long poiId, List<StoreDistanceResult> results);

    /**
     * 캐시 키 생성
     */
    private String generateCacheKey(Long poiId, int distance);

    // H3 검색 전략 record
    private record H3SearchStrategy(int resolution, int kRing) {}
}
