package com.domain.common.service;

import com.domain.review.dto.response.StoreDistanceResult;
import com.domain.common.entity.Poi;
import com.domain.common.repository.PoiRepository;
import com.domain.store.dto.response.StoreInfo;
import com.domain.store.entity.Store;
import com.domain.store.repository.StoreRepository;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.global.constants.ErrorCode;
import com.global.constants.PagingConstants;
import com.global.constants.SearchDistance;
import com.global.exception.ApiException;
import com.global.utils.geo.H3SearchStrategy;
import com.global.utils.geo.H3Utils;
import com.global.utils.geo.HaversineCalculator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpatialSearchService {

    private final H3Utils h3Service;
    private final PoiRepository poiRepository;
    private final StoreRepository storeRepository;
    private final HaversineCalculator haversineCalculator;
    private final SpatialCacheService cacheService;

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
        for (SearchDistance fixDist : SearchDistance.values()) {
            // H3를 사용해 현재 반경 내 POI들 조회
            int radius = fixDist.getMeters();
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
    public List<StoreDistanceResult> getNearbyStoresWithDistance(Long poiId, int requestedDistance) {
        log.debug("Getting stores near POI {} within {}m", poiId, requestedDistance);

        // 1. 요청 거리 검증 (거리 밴드만 허용)
        validDistance(requestedDistance);

        // 2. 캐시 확인
        if (cacheService.hasCache(poiId, requestedDistance)) {
            log.debug("Cache hit for POI {} at {}m band", poiId, requestedDistance);
            return cacheService.getCache(poiId, requestedDistance);
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

    @Transactional(readOnly = true)
    public List<StoreInfo> getNearbyStores(Long poiId, int requestedDistance) {
        log.debug("Getting stores near POI {} within {}m", poiId, requestedDistance);

        // 1. 요청 거리 검증 (거리 밴드만 허용)
        validDistance(requestedDistance);

        List<StoreDistanceResult> results = getNearbyStoresWithDistance(poiId, requestedDistance);

        List<Long> storeIds = results.stream()
                .map(StoreDistanceResult::storeId)
                .toList();

        if (storeIds.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, Store> storeMap = storeRepository.findAllById(storeIds).stream()
                .collect(Collectors.toMap(Store::getId, Function.identity()));

        // 5. StoreInfo 리스트 생성 (거리 정보 포함)
        List<StoreInfo> storeInfos = results.stream()
                .map(r -> {
                    Store store = storeMap.get(r.storeId());
                    if (store == null) {
                        log.warn("Store not found for ID: {}", r.storeId());
                        return null;
                    }
                    return new StoreInfo(
                            store.getId(),
                            store.getName(),
                            store.getLatitude(),
                            store.getLongitude(),
                            r.distance()
                    );
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        log.info("Found {} stores near POI {} within {}m", storeInfos.size(), poiId, requestedDistance);
        return storeInfos;
    }

    /**
     * H3를 사용해 사용자 주변 POI들 찾기
     */
    private List<Poi> findNearbyPoisByH3(double lat, double lon, int maxDistance) {
        H3SearchStrategy.Strategy strategy = H3SearchStrategy.determineStrategy(maxDistance);
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
        H3SearchStrategy.Strategy strategy = H3SearchStrategy.determineStrategy(searchDistance);
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

            if (candidateStores.size() > PagingConstants.DEFAULT_SIZE.value) {
                log.debug("... and {} more stores", candidateStores.size() - 20);
            }
        }
        log.info("===================================");

        return candidateStores;
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
        cacheService.saveCache(poi.getId(), distanceBand, results);
        log.debug("Cached {} stores for distance band {}m", results.size(), distanceBand);

        return results;
    }

    private void validDistance(int distance) {
        if (!SearchDistance.isValid(distance)) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR);
        }
    }
}
