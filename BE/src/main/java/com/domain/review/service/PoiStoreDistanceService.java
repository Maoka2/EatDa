package com.domain.review.service;

import com.domain.review.constants.ReviewConstants;
import com.domain.review.dto.response.StoreDistanceResult;
import com.domain.review.entity.Poi;
import com.domain.review.repository.PoiRepository;
import com.domain.store.entity.Store;
import com.domain.store.repository.StoreRepository;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PoiStoreDistanceService {

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
        for (int radius : ReviewConstants.SEARCH_DISTANCES) {
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
     * @param poiId             POI ID
     * @param requestedDistance 요청 거리 (300, 500, 700, 850, 1000, 2000m 중 하나)
     * @return 거리 내 Store 목록 (거리순 정렬)
     */
    @Transactional(readOnly = true)
    public List<StoreDistanceResult> getNearbyStores(Long poiId, int requestedDistance) {
        log.debug("Getting stores near POI {} within {}m", poiId, requestedDistance);

        // 1. 요청 거리 검증 (거리 밴드만 허용)
        if (!ReviewConstants.SEARCH_DISTANCES.contains(requestedDistance)) {
            throw new IllegalArgumentException(
                    String.format("Invalid distance: %d. Must be one of %s", requestedDistance,
                            ReviewConstants.SEARCH_DISTANCES)
            );
        }

        // 2. 캐시 확인
        if (hasDistanceCache(poiId, requestedDistance)) {
            log.debug("Cache hit for POI {} at {}m band", poiId, requestedDistance);
            return getDistanceCache(poiId, requestedDistance);
        }

        // 3. 캐시 미스 - POI 정보 조회
        log.debug("Cache miss for POI {} at {}m band, fetching from DB", poiId, requestedDistance);
        Poi poi = poiRepository.findById(poiId)
                .orElseThrow(() -> new NoSuchElementException("POI not found: " + poiId));

        // 4. DB에서 조회 및 캐싱
        List<StoreDistanceResult> results = fetchAndCacheStores(poi, requestedDistance);

        log.info("Found {} stores near POI {} within {}m", results.size(), poiId, requestedDistance);
        return results;
    }

    //    /**
    //     * Store 등록/업데이트 시 캐시 갱신 (선택적)
    //     * 새로운 Store가 추가되거나 위치가 변경될 때 주변 POI들의 캐시를 업데이트
    //     *
    //     * @param store 등록/수정된 Store
    //     */
    //    @Transactional
    //    public void updateCacheForStore(Store store) {
    //        log.info("Updating cache for store: {} at ({}, {})",
    //                store.getId(), store.getLatitude(), store.getLongitude());
    //
    //        try {
    //            // 1. Store 주변의 POI들 찾기 (최대 검색 거리 사용)
    //            List<Poi> nearbyPois = findNearbyPoisByH3(
    //                    store.getLatitude(),
    //                    store.getLongitude(),
    //                    MAX_SEARCH_DISTANCE
    //            );
    //
    //            log.debug("Found {} POIs near store {}", nearbyPois.size(), store.getId());
    //
    //            // 2. 각 POI에 대해 캐시 업데이트
    //            for (Poi poi : nearbyPois) {
    //                // POI와 Store 간의 거리 계산
    //                int distance = haversineCalculator.calculate(
    //                        poi.getLatitude(), poi.getLongitude(),
    //                        store.getLatitude(), store.getLongitude()
    //                );
    //
    //                // 최대 거리 내에 있는 경우만 처리
    //                if (distance <= MAX_SEARCH_DISTANCE) {
    //                    // 각 거리 카테고리별로 캐시 업데이트
    //                    for (int searchDistance : SEARCH_DISTANCES) {
    //                        if (distance <= searchDistance) {
    //                            String cacheKey = generateCacheKey(poi.getId(), searchDistance);
    //
    //                            // 해당 Store를 캐시에 추가/업데이트
    //                            redisTemplate.opsForZSet().add(cacheKey, store.getId(), distance);
    //
    //                            // TTL 갱신
    //                            redisTemplate.expire(cacheKey, CACHE_TTL);
    //                        }
    //                    }
    //
    //                    log.trace("Updated cache for POI {} with store {} at distance {}m",
    //                            poi.getId(), store.getId(), distance);
    //                }
    //            }
    //
    //            log.info("Cache update completed for store {}", store.getId());
    //
    //        } catch (Exception e) {
    //            // 캐시 업데이트 실패는 서비스에 영향을 주지 않도록 로그만 남김
    //            log.error("Failed to update cache for store {}: {}", store.getId(), e.getMessage());
    //        }
    //    }
    //
    //    /**
    //     * Store 삭제 시 캐시에서 제거
    //     * 삭제된 Store를 모든 관련 POI의 캐시에서 제거
    //     *
    //     * @param storeId 삭제할 Store ID
    //     */
    //    @Transactional
    //    public void removeStoreFromCache(Long storeId) {
    //        log.info("Removing store {} from all POI caches", storeId);
    //
    //        try {
    //            // 1. 삭제할 Store 정보 조회
    //            Store store = storeRepository.findById(storeId)
    //                    .orElse(null);
    //
    //            if (store == null) {
    //                log.warn("Store {} not found, skipping cache removal", storeId);
    //                return;
    //            }
    //
    //            // 2. Store 주변의 POI들 찾기
    //            List<Poi> nearbyPois = findNearbyPoisByH3(
    //                    store.getLatitude(),
    //                    store.getLongitude(),
    //                    MAX_SEARCH_DISTANCE
    //            );
    //
    //            log.debug("Found {} POIs that might have store {} in cache", nearbyPois.size(), storeId);
    //
    //            // 3. 각 POI의 모든 거리 카테고리 캐시에서 Store 제거
    //            int removedCount = 0;
    //            for (Poi poi : nearbyPois) {
    //                for (int searchDistance : SEARCH_DISTANCES) {
    //                    String cacheKey = generateCacheKey(poi.getId(), searchDistance);
    //
    //                    // Store가 캐시에 있으면 제거
    //                    Long removed = redisTemplate.opsForZSet().remove(cacheKey, storeId);
    //                    if (removed != null && removed > 0) {
    //                        removedCount++;
    //                        log.trace("Removed store {} from POI {} cache at {}m",
    //                                storeId, poi.getId(), searchDistance);
    //                    }
    //                }
    //            }
    //
    //            log.info("Removed store {} from {} cache entries", storeId, removedCount);
    //
    //        } catch (Exception e) {
    //            // 캐시 제거 실패는 서비스에 영향을 주지 않도록 로그만 남김
    //            log.error("Failed to remove store {} from cache: {}", storeId, e.getMessage());
    //        }
    //    }

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
     * H3를 사용해 POI 주변 Store 후보군 찾기
     *
     * @param lat            중심점(POI) 위도
     * @param lon            중심점(POI) 경도
     * @param searchDistance 검색 거리 (미터)
     * @return H3 셀 내의 모든 Store 후보군
     */
    private List<Store> findCandidateStoresByH3(double lat, double lon, int searchDistance) {
        // 1. 거리에 따른 H3 검색 전략 결정
        H3SearchStrategy strategy = determineH3Strategy(searchDistance);
        log.debug("Finding Store candidates within {}m using H3 strategy: resolution={}, kRing={}",
                searchDistance, strategy.resolution(), strategy.kRing());

        // 2. 중심점의 H3 인덱스 계산
        long centerH3 = h3Service.encode(lat, lon, strategy.resolution());

        // 3. k-ring으로 주변 셀들의 H3 인덱스 가져오기
        List<Long> h3Cells = h3Service.getKRing(centerH3, strategy.kRing());
        log.debug("H3 cells to search: {} cells", h3Cells.size());

        // 4. 해상도에 따라 적절한 컬럼으로 Store 조회
        List<Store> candidateStores = switch (strategy.resolution()) {
            case 7 -> storeRepository.findByH3Index7In(h3Cells);
            case 8 -> storeRepository.findByH3Index8In(h3Cells);
            case 9 -> storeRepository.findByH3Index9In(h3Cells);
            case 10 -> storeRepository.findByH3Index10In(h3Cells);
            default -> throw new IllegalArgumentException("Unsupported H3 resolution: " + strategy.resolution());
        };

        // 5. H3 필터링 결과 로깅
        log.info("======= H3 Filtering Result =======");
        log.info("Center location: ({}, {})", lat, lon);
        log.info("Search distance: {}m", searchDistance);
        log.info("H3 Resolution: {}, K-ring: {}", strategy.resolution(), strategy.kRing());
        log.info("Total candidate stores found: {}", candidateStores.size());

        if (!candidateStores.isEmpty() && log.isDebugEnabled()) {
            log.debug("Store IDs from H3 filtering: {}",
                    candidateStores.stream()
                            .map(Store::getId)
                            .collect(Collectors.toList()));

            if (candidateStores.size() > ReviewConstants.DEFAULT_PAGE_SIZE) {
                log.debug("... and {} more stores", candidateStores.size() - 20);
            }
        }
        log.info("===================================");

        return candidateStores;
    }

    /**
     * 거리에 따른 H3 검색 전략 결정
     */
    private H3SearchStrategy determineH3Strategy(int distanceMeters) {
        if (distanceMeters <= 300) {
            // Res 10: 75.9m, k=4: 75.9m × 4 = 303.6m (300m 커버)
            return new H3SearchStrategy(10, 4);
        } else if (distanceMeters <= 500) {
            // Res 9: 201m, k=3: 201m × 3 = 603m (500m 충분히 커버)
            return new H3SearchStrategy(9, 3);
        } else if (distanceMeters <= 700) {
            // Res 9: 201m, k=4: 201m × 4 = 804m (700m 충분히 커버)
            return new H3SearchStrategy(9, 4);
        } else if (distanceMeters <= 1000) {
            // Res 8: 531m, k=2: 531m × 2 = 1062m (1000m 충분히 커버)
            // 더 넉넉하게 k=3 사용
            return new H3SearchStrategy(8, 3);
        } else {
            // Res 7: 1406m, k=2: 1406m × 2 = 2812m (2000m 충분히 커버)
            return new H3SearchStrategy(7, 2);
        }
    }

    /**
     * 실제 거리 계산 및 필터링
     *
     * @param centerLat   중심점(POI) 위도
     * @param centerLon   중심점(POI) 경도
     * @param stores      H3로 필터링된 Store 목록
     * @param maxDistance 최대 거리 제한 (미터)
     * @return 거리 정보를 포함한 Store 결과 목록 (거리순 정렬)
     */
    private List<StoreDistanceResult> calculateAndFilterDistances(
            double centerLat, double centerLon, List<Store> stores, int maxDistance) {

        log.debug("Calculating distances for {} stores within {}m", stores.size(), maxDistance);

        List<StoreDistanceResult> results = stores.stream()
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

        log.info("After distance filtering: {} stores remain (within {}m)", results.size(), maxDistance);

        return results;
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

    // 캐시 키 생성 (거리별 개별 키)
    private String generateDistanceCacheKey(Long poiId, int distanceBand) {
        return String.format("poi:%d:stores:%dm", poiId, distanceBand);
    }

    /**
     * 특정 거리 밴드의 캐시 존재 여부 확인
     *
     * @param poiId        POI ID
     * @param distanceBand 거리 밴드 (300, 500, 700, 850, 1000, 2000)
     * @return 캐시 존재 여부
     */
    private boolean hasDistanceCache(Long poiId, int distanceBand) {
        String cacheKey = generateDistanceCacheKey(poiId, distanceBand);

        // Redis에 해당 키가 존재하는지 확인
        Boolean exists = redisTemplate.hasKey(cacheKey);

        if (exists) {
            // 키는 있지만 데이터가 비어있을 수 있으므로 실제 데이터 확인
            Long size = redisTemplate.opsForZSet().size(cacheKey);
            return size != null && size > 0;
        }

        return false;
    }

    /**
     * 특정 거리 밴드의 캐시 조회
     *
     * @param poiId        POI ID
     * @param distanceBand 거리 밴드 (300, 500, 700, 850, 1000, 2000)
     * @return 캐싱된 Store 목록 (거리순 정렬), 캐시가 없으면 빈 리스트
     */
    private List<StoreDistanceResult> getDistanceCache(Long poiId, int distanceBand) {
        String cacheKey = generateDistanceCacheKey(poiId, distanceBand);

        // ZSet에서 모든 데이터를 score(거리)와 함께 조회
        Set<ZSetOperations.TypedTuple<Object>> cachedData =
                redisTemplate.opsForZSet().rangeWithScores(cacheKey, 0, -1);

        if (cachedData == null || cachedData.isEmpty()) {
            return new ArrayList<>();
        }

        // TypedTuple을 StoreDistanceResult로 변환
        return cachedData.stream()
                .map(tuple -> StoreDistanceResult.builder()
                        .storeId(Long.valueOf(Objects.requireNonNull(tuple.getValue()).toString()))
                        .distance(Objects.requireNonNull(tuple.getScore()).intValue())
                        .build())
                .sorted(Comparator.comparingInt(StoreDistanceResult::distance))
                .collect(Collectors.toList());
    }

    /**
     * 특정 거리 밴드의 Store 목록을 캐시에 저장
     *
     * @param poiId        POI ID
     * @param distanceBand 거리 밴드 (300, 500, 700, 850, 1000, 2000)
     * @param stores       저장할 Store 목록 (거리 정보 포함)
     */
    private void saveDistanceCache(Long poiId, int distanceBand, List<StoreDistanceResult> stores) {
        if (stores == null || stores.isEmpty()) {
            log.debug("No stores to cache for POI {} at {}m band", poiId, distanceBand);
            return;
        }

        String cacheKey = generateDistanceCacheKey(poiId, distanceBand);

        // 기존 캐시 삭제 (덮어쓰기) 근데 그럴일 없을 듯
        redisTemplate.delete(cacheKey);

        // ZSet에 Store ID를 value로, 거리를 score로 저장
        stores.forEach(store ->
                redisTemplate.opsForZSet().add(
                        cacheKey,
                        store.storeId(),
                        store.distance()
                )
        );

        // TTL 설정
        redisTemplate.expire(cacheKey, Duration.ofHours(ReviewConstants.CACHE_TTL_HOURS));

        log.debug("Cached {} stores for POI {} at {}m band", stores.size(), poiId, distanceBand);
    }

    /**
     * DB에서 특정 거리 밴드의 Store를 조회하고 캐싱
     *
     * @param poi          POI 엔티티
     * @param distanceBand 조회할 거리 밴드 (300, 500, 700, 850, 1000, 2000)
     * @return 해당 거리 밴드 내의 Store 목록 (거리순 정렬)
     */
    private List<StoreDistanceResult> fetchAndCacheStores(Poi poi, int distanceBand) {
        log.debug("Fetching stores from DB for POI {} within {}m band", poi.getId(), distanceBand);

        // H3로 후보군 조회
        List<Store> candidateStores = findCandidateStoresByH3(
                poi.getLatitude(),
                poi.getLongitude(),
                distanceBand
        );

        // 실제 거리 계산 및 필터링
        List<StoreDistanceResult> results = calculateAndFilterDistances(
                poi.getLatitude(),
                poi.getLongitude(),
                candidateStores,
                distanceBand
        );

        if (results.isEmpty()) {
            log.debug("No stores found within {}m of POI {}, not caching", distanceBand, poi.getId());
            return results;  // 빈 리스트 반환, 캐싱하지 않음
        }

        // 캐싱
        saveDistanceCache(poi.getId(), distanceBand, results);
        log.debug("Cached {} stores for distance band {}m", results.size(), distanceBand);

        return results;
    }

    // H3 검색 전략 record
    private record H3SearchStrategy(int resolution, int kRing) {
    }
}
