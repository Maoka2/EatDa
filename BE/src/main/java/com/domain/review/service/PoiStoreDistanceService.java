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
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PoiStoreDistanceService {

    private static final List<Integer> SEARCH_DISTANCES = List.of(300, 500, 700, 1000, 2000);
    private static final int MAX_SEARCH_DISTANCE = 2000;
    private static final Duration CACHE_TTL = Duration.ofDays(1);

    private final H3Service h3Service;
    private final PoiRepository poiRepository;
    private final StoreRepository storeRepository;
    private final HaversineCalculator haversineCalculator;
    private final RedisTemplate<String, Object> redisTemplate;

// ===== Public APIs =====

    /**
     * 사용자 위치에서 가장 가까운 POI 찾기
     *
     * @param userLat 사용자 위도
     * @param userLon 사용자 경도
     * @return 가장 가까운 POI (없으면 예외 발생)
     */
    public Poi findNearestPoi(double userLat, double userLon) {
        log.debug("Finding nearest POI for user location: ({}, {})", userLat, userLon);

        // 1. 가까운 POI부터 찾기 위해 점진적으로 거리 확대
        int[] searchRadii = {300, 500, 700, 1000, 2000}; // 미터 단위

        for (int radius : searchRadii) {
            // H3를 사용해 현재 반경 내 POI들 조회
            List<Poi> nearbyPois = findNearbyPoisByH3(userLat, userLon, radius);

            if (!nearbyPois.isEmpty()) {
                // 가장 가까운 POI 찾기 (이미 정렬되어 있으므로 첫 번째 요소)
                Poi nearestPoi = nearbyPois.getFirst();

                // 실제 거리 계산 (로깅용)
                int distance = haversineCalculator.calculate(
                        userLat, userLon,
                        nearestPoi.getLatitude(), nearestPoi.getLongitude()
                );

                log.info("Found nearest POI: {} ({}m away)", nearestPoi.getName(), distance);
                return nearestPoi;
            }

            log.debug("No POI found within {}m, expanding search radius", radius);
        }

        // POI를 찾지 못한 경우
        throw new NoSuchElementException(
                String.format("No POI found near location (%.6f, %.6f)", userLat, userLon)
        );
    }

    /**
     * POI 기준으로 거리별 Store 목록 조회 (메인 API)
     *
     * @param poiId POI ID
     * @param requestedDistance 요청 거리 (300, 500, 700, 1000, 2000m 중 하나)
     * @return 거리 내 Store 목록 (거리순 정렬)
     */
    @Transactional(readOnly = true)
    public List<StoreDistanceResult> getNearbyStores(Long poiId, int requestedDistance) {
        log.debug("Getting stores near POI {} within {}m", poiId, requestedDistance);

        // 1. 요청 거리 검증
        if (!SEARCH_DISTANCES.contains(requestedDistance)) {
            throw new IllegalArgumentException(
                    String.format("Invalid distance: %d. Must be one of %s", requestedDistance, SEARCH_DISTANCES)
            );
        }

        // 2. Redis 캐시 확인
        String cacheKey = generateCacheKey(poiId, requestedDistance);
        Set<ZSetOperations.TypedTuple<Object>> cachedData =
                redisTemplate.opsForZSet().rangeByScoreWithScores(cacheKey, 0, requestedDistance);

        if (cachedData != null && !cachedData.isEmpty()) {
            log.debug("Cache hit for POI {} at {}m: {} stores found", poiId, requestedDistance, cachedData.size());
            return convertCachedDataToResults(cachedData);
        }
        // 3. 캐시 미스 - POI 정보 조회
        log.debug("Cache miss for POI {} at {}m, fetching from DB", poiId, requestedDistance);
        Poi poi = poiRepository.findById(poiId)
                .orElseThrow(() -> new NoSuchElementException("POI not found: " + poiId));

        // 4. H3를 사용해 주변 Store들 검색
        List<Store> nearbyStores = findNearbyStoresByH3(
                poi.getLatitude(),
                poi.getLongitude(),
                requestedDistance
        );

        // 5. 정확한 거리 계산 및 필터링
        List<StoreDistanceResult> results = calculateAndFilterDistances(
                poi.getLatitude(),
                poi.getLongitude(),
                nearbyStores,
                requestedDistance
        );

        // 6. 결과를 Redis에 캐싱 (모든 거리 카테고리에 대해)
        if (!results.isEmpty()) {
            updateRedisCache(poiId, results);
        }

        log.info("Found {} stores near POI {} within {}m", results.size(), poiId, requestedDistance);
        return results;
    }

    /**
     * Store 등록/업데이트 시 캐시 갱신 (선택적)
     * 새로운 Store가 추가되거나 위치가 변경될 때 주변 POI들의 캐시를 업데이트
     *
     * @param store 등록/수정된 Store
     */
    @Transactional
    public void updateCacheForStore(Store store) {
        log.info("Updating cache for store: {} at ({}, {})",
                store.getId(), store.getLatitude(), store.getLongitude());

        try {
            // 1. Store 주변의 POI들 찾기 (최대 검색 거리 사용)
            List<Poi> nearbyPois = findNearbyPoisByH3(
                    store.getLatitude(),
                    store.getLongitude(),
                    MAX_SEARCH_DISTANCE
            );

            log.debug("Found {} POIs near store {}", nearbyPois.size(), store.getId());

            // 2. 각 POI에 대해 캐시 업데이트
            for (Poi poi : nearbyPois) {
                // POI와 Store 간의 거리 계산
                int distance = haversineCalculator.calculate(
                        poi.getLatitude(), poi.getLongitude(),
                        store.getLatitude(), store.getLongitude()
                );

                // 최대 거리 내에 있는 경우만 처리
                if (distance <= MAX_SEARCH_DISTANCE) {
                    // 각 거리 카테고리별로 캐시 업데이트
                    for (int searchDistance : SEARCH_DISTANCES) {
                        if (distance <= searchDistance) {
                            String cacheKey = generateCacheKey(poi.getId(), searchDistance);

                            // 해당 Store를 캐시에 추가/업데이트
                            redisTemplate.opsForZSet().add(cacheKey, store.getId(), distance);

                            // TTL 갱신
                            redisTemplate.expire(cacheKey, CACHE_TTL);
                        }
                    }

                    log.trace("Updated cache for POI {} with store {} at distance {}m",
                            poi.getId(), store.getId(), distance);
                }
            }

            log.info("Cache update completed for store {}", store.getId());

        } catch (Exception e) {
            // 캐시 업데이트 실패는 서비스에 영향을 주지 않도록 로그만 남김
            log.error("Failed to update cache for store {}: {}", store.getId(), e.getMessage());
        }
    }

    /**
     * Store 삭제 시 캐시에서 제거
     * 삭제된 Store를 모든 관련 POI의 캐시에서 제거
     *
     * @param storeId 삭제할 Store ID
     */
    @Transactional
    public void removeStoreFromCache(Long storeId) {
        log.info("Removing store {} from all POI caches", storeId);

        try {
            // 1. 삭제할 Store 정보 조회
            Store store = storeRepository.findById(storeId)
                    .orElse(null);

            if (store == null) {
                log.warn("Store {} not found, skipping cache removal", storeId);
                return;
            }

            // 2. Store 주변의 POI들 찾기
            List<Poi> nearbyPois = findNearbyPoisByH3(
                    store.getLatitude(),
                    store.getLongitude(),
                    MAX_SEARCH_DISTANCE
            );

            log.debug("Found {} POIs that might have store {} in cache", nearbyPois.size(), storeId);

            // 3. 각 POI의 모든 거리 카테고리 캐시에서 Store 제거
            int removedCount = 0;
            for (Poi poi : nearbyPois) {
                for (int searchDistance : SEARCH_DISTANCES) {
                    String cacheKey = generateCacheKey(poi.getId(), searchDistance);

                    // Store가 캐시에 있으면 제거
                    Long removed = redisTemplate.opsForZSet().remove(cacheKey, storeId);
                    if (removed != null && removed > 0) {
                        removedCount++;
                        log.trace("Removed store {} from POI {} cache at {}m",
                                storeId, poi.getId(), searchDistance);
                    }
                }
            }

            log.info("Removed store {} from {} cache entries", storeId, removedCount);

        } catch (Exception e) {
            // 캐시 제거 실패는 서비스에 영향을 주지 않도록 로그만 남김
            log.error("Failed to remove store {} from cache: {}", storeId, e.getMessage());
        }
    }

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
     * Redis 캐시 데이터를 StoreDistanceResult로 변환
     */
    private List<StoreDistanceResult> convertCachedDataToResults(
            Set<ZSetOperations.TypedTuple<Object>> cachedData) {

        return cachedData.stream()
                .map(typedTuple -> StoreDistanceResult.builder()
                        .storeId(Long.valueOf(typedTuple.getValue().toString()))
                        .distance(typedTuple.getScore().intValue())
                        .build())
                .sorted(Comparator.comparingInt(StoreDistanceResult::distance))
                .collect(Collectors.toList());
    }

    /**
     * Redis 캐시 업데이트
     */
    private void updateRedisCache(Long poiId, List<StoreDistanceResult> results) {
        if (results.isEmpty()) {
            log.debug("No stores to cache for POI: {}", poiId);
            return;
        }

        log.debug("Updating Redis cache for POI: {} with {} stores", poiId, results.size());

        // 각 거리 카테고리별로 캐시 생성
        for (int distanceThreshold : SEARCH_DISTANCES) {
            String cacheKey = generateCacheKey(poiId, distanceThreshold);

            // 기존 캐시 삭제
            redisTemplate.delete(cacheKey);

            // 해당 거리 이내의 Store들만 필터링하여 저장
            List<StoreDistanceResult> storesWithinDistance = results.stream()
                    .filter(result -> result.distance() <= distanceThreshold)
                    .toList();

            if (!storesWithinDistance.isEmpty()) {
                // Sorted Set으로 저장 (score = distance)
                storesWithinDistance.forEach(result ->
                        redisTemplate.opsForZSet().add(
                                cacheKey,
                                result.storeId(),
                                result.distance()
                        )
                );

                // TTL 설정 (1일)
                redisTemplate.expire(cacheKey, Duration.ofDays(1));

                log.trace("Cached {} stores for POI: {} at {}m threshold",
                        storesWithinDistance.size(), poiId, distanceThreshold);
            }
        }
    }

    /**
     * 캐시 키 생성
     * POI ID와 거리를 조합하여 고유한 캐시 키 생성
     *
     * @param poiId POI ID
     * @param distance 거리 (미터)
     * @return Redis 캐시 키
     */
    private String generateCacheKey(Long poiId, int distance) {
        // 검증
        if (poiId == null) {
            throw new IllegalArgumentException("POI ID cannot be null");
        }

        if (!SEARCH_DISTANCES.contains(distance)) {
            throw new IllegalArgumentException(
                    String.format("Invalid distance: %d. Must be one of %s", distance, SEARCH_DISTANCES)
            );
        }

        // 형식: "poi:stores:{poiId}:{distance}m"
        return String.format("poi:stores:%d:%dm", poiId, distance);
    }


    // H3 검색 전략 record
    private record H3SearchStrategy(int resolution, int kRing) {}
}
