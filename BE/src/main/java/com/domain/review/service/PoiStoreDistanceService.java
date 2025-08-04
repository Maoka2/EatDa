package com.domain.review.service;

import com.domain.review.dto.response.StoreDistanceResult;
import com.domain.review.entity.Poi;
import com.domain.review.entity.PoiDistance;
import com.domain.review.entity.Store;
import com.domain.review.repository.PoiDistanceRepository;
import com.domain.review.repository.PoiRepository;
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

    private final PoiRepository poiRepository;
    private final PoiDistanceRepository poiDistanceRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final GeohashService geohashService;
    private final HaversineCalculator haversineCalculator;

    @Value("${app.poi.distance.max-radius}")
    private int maxDistanceRadius;  // 2000m

    @Value("${app.poi.distance.geohash-precision}")
    private int geohashPrecision;  // 8

    @Value("${app.poi.distance.search-distances}")
    private List<Integer> searchDistances;  // [300, 500, 700, 1000, 2000]

    /**
     * 새로운 가게 등록 시 주변 POI와의 거리 계산 및 저장
     */
    @Transactional
    public void calculateAndSaveDistance(final Store store) {
        log.info("Starting distance calculation for store: {} at ({}, {})",
                store.getId(), store.getLatitude(), store.getLongitude());

        try {
            // 1. 가게 위치의 geohash 계산 (8자리)
            String storeGeohash = geohashService.encode(
                    store.getLatitude(),
                    store.getLongitude(),
                    geohashPrecision
            );

            // 2. 주변 POI 조회
            List<Poi> nearbyPois = findNearbyPoisByGeohash(
                    storeGeohash,
                    store.getLatitude(),
                    store.getLongitude()
            );

            log.debug("Found {} nearby POIs", nearbyPois.size());

            // 3. 각 POI와의 거리 계산
            List<PoiDistance> distances = calculateDistances(store, nearbyPois);

            // 4. DB에 저장
            saveDistances(distances);

            // 5. Redis 캐시 업데이트 (거리별로)
            updateMultiLevelRedisCache(distances);

            log.info("Completed. Saved {} POI-Store distances", distances.size());

        } catch (Exception e) {
            log.error("Error calculating distances for store: {}", store.getId(), e);
            throw new RuntimeException("거리 계산 중 오류 발생", e);
        }
    }

    /**
     * 특정 POI에서 가까운 가게 목록 조회
     */
    @Transactional(readOnly = true)
    public List<StoreDistanceResult> getNearbyStores(final Long poiId,
                                                     final int requestedDistance) {
        // 1. 요청 거리에 맞는 캐시 거리 찾기
        int cacheDistance = findCacheDistance(requestedDistance);
        String cacheKey = generateCacheKey(poiId, cacheDistance);

        // 2. Redis 조회
        Set<Object> cachedStoreIds = redisTemplate.opsForZSet()
                .rangeByScore(cacheKey, 0, requestedDistance);

        if (cachedStoreIds != null && !cachedStoreIds.isEmpty()) {
            log.debug("Cache hit for POI: {} at distance: {}", poiId, requestedDistance);
            return convertToStoreDistanceResults(poiId, cachedStoreIds, cacheKey);
        }

        // 3. Cache miss - DB 조회
        log.debug("Cache miss for POI: {} at distance: {}", poiId, requestedDistance);
        List<PoiDistance> distances = poiDistanceRepository
                .findByPoiIdAndDistanceLessThanEqualOrderByDistanceAsc(poiId, cacheDistance);

        // 4. 캐시 업데이트
        if (!distances.isEmpty()) {
            updateMultiLevelCache(poiId, distances);
        }

        // 5. 요청 거리로 필터링하여 반환
        return distances.stream()
                .filter(d -> d.getDistance() <= requestedDistance)
                .map(d -> StoreDistanceResult.builder()
                        .storeId(d.getStoreId())
                        .distance(d.getDistance())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 가게 삭제 시 관련 거리 정보 제거
     */
    @Transactional
    public void removeStoreDistances(final Long storeId) {
        // 1. 해당 가게의 모든 거리 정보 조회
        List<PoiDistance> distances = poiDistanceRepository.findByStoreId(storeId);

        // 2. Redis에서 제거
        distances.forEach(d -> {
            for (int distance : searchDistances) {
                String cacheKey = generateCacheKey(d.getPoiId(), distance);
                redisTemplate.opsForZSet().remove(cacheKey, storeId);
            }
        });

        // 3. DB에서 제거
        poiDistanceRepository.deleteByStoreId(storeId);

        log.info("Removed all distance data for store: {}", storeId);
    }

    // ===== Private Methods =====

    /**
     * Geohash를 활용한 주변 POI 조회
     */
    private List<Poi> findNearbyPoisByGeohash(final String centerGeohash,
                                              final double centerLat,
                                              final double centerLon) {
        // 검색 거리에 맞는 geohash precision 결정
        int searchPrecision = determineSearchPrecision(maxDistanceRadius);
        String searchGeohash = centerGeohash.substring(0, searchPrecision);

        // 중심 + 인접 8개 격자
        Set<String> geohashPrefixes = geohashService.getNeighbors(searchGeohash);
        geohashPrefixes.add(searchGeohash);

        // 모든 격자에서 POI 조회
        List<Poi> allNearbyPois = new ArrayList<>();
        for (String prefix : geohashPrefixes) {
            List<Poi> pois = poiRepository.findByGeohashStartingWith(prefix);
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

    /**
     * 검색 거리에 따른 최적 geohash precision 결정
     */
    private int determineSearchPrecision(int distanceMeters) {
        if (distanceMeters <= 100) return 8;       // 38m 격자
        else if (distanceMeters <= 300) return 7;  // 152m 격자
        else if (distanceMeters <= 1000) return 6; // 1.22km 격자
        else if (distanceMeters <= 3000) return 5; // 4.8km 격자
        else return 4;                              // 40km 격자
    }

    /**
     * Store와 POI 목록 간의 거리 계산
     */
    private List<PoiDistance> calculateDistances(final Store store, final List<Poi> pois) {
        return pois.stream()
                .map(poi -> {
                    int distance = haversineCalculator.calculate(
                            store.getLatitude(), store.getLongitude(),
                            poi.getLatitude(), poi.getLongitude()
                    );

                    return PoiDistance.builder()
                            .poiId(poi.getId())
                            .storeId(store.getId())
                            .distance(distance)
                            .build();
                })
                .filter(pd -> pd.getDistance() <= maxDistanceRadius)
                .sorted(Comparator.comparingInt(PoiDistance::getDistance))
                .collect(Collectors.toList());
    }

    /**
     * 거리 정보를 DB에 저장
     */
    private void saveDistances(final List<PoiDistance> distances) {
        if (distances.isEmpty()) {
            return;
        }

        Long storeId = distances.get(0).getStoreId();
        poiDistanceRepository.deleteByStoreId(storeId);
        poiDistanceRepository.saveAll(distances);
    }

    /**
     * 다단계 Redis 캐시 업데이트 (가게 등록 시)
     */
    private void updateMultiLevelRedisCache(final List<PoiDistance> distances) {
        Map<Long, List<PoiDistance>> groupedByPoi = distances.stream()
                .collect(Collectors.groupingBy(PoiDistance::getPoiId));

        groupedByPoi.forEach((poiId, poiDistances) -> {
            // 각 거리별로 캐시 생성
            for (int distanceThreshold : searchDistances) {
                String cacheKey = generateCacheKey(poiId, distanceThreshold);

                // 기존 데이터 제거
                poiDistances.forEach(pd -> {
                    redisTemplate.opsForZSet().remove(cacheKey, pd.getStoreId());
                });

                // 거리 임계값 이내의 가게만 추가
                poiDistances.stream()
                        .filter(pd -> pd.getDistance() <= distanceThreshold)
                        .forEach(pd -> {
                            redisTemplate.opsForZSet().add(
                                    cacheKey,
                                    pd.getStoreId(),
                                    pd.getDistance()
                            );
                        });

                redisTemplate.expire(cacheKey, Duration.ofDays(1));
            }
        });
    }

    /**
     * 다단계 캐시 업데이트 (조회 시)
     */
    private void updateMultiLevelCache(Long poiId, List<PoiDistance> allDistances) {
        for (int distance : searchDistances) {
            String cacheKey = generateCacheKey(poiId, distance);

            allDistances.stream()
                    .filter(d -> d.getDistance() <= distance)
                    .forEach(d -> {
                        redisTemplate.opsForZSet().add(
                                cacheKey,
                                d.getStoreId(),
                                d.getDistance()
                        );
                    });

            redisTemplate.expire(cacheKey, Duration.ofDays(1));
        }
    }

    /**
     * 요청 거리에 맞는 캐시 거리 찾기
     */
    private int findCacheDistance(int requestedDistance) {
        return searchDistances.stream()
                .filter(d -> d >= requestedDistance)
                .findFirst()
                .orElse(maxDistanceRadius);
    }

    /**
     * 캐시 키 생성
     */
    private String generateCacheKey(Long poiId, Integer maxDistance) {
        if (maxDistance == null) {
            return String.format("poi:distance:%d:all", poiId);
        }
        return String.format("poi:distance:%d:%dm", poiId, maxDistance);
    }

    /**
     * Redis 캐시 데이터를 StoreDistanceResult로 변환
     */
    private List<StoreDistanceResult> convertToStoreDistanceResults(Long poiId,
                                                                    Set<Object> storeIds,
                                                                    String cacheKey) {
        if (storeIds == null || storeIds.isEmpty()) {
            return new ArrayList<>();
        }

        return storeIds.stream()
                .map(storeId -> {
                    Double distance = redisTemplate.opsForZSet()
                            .score(cacheKey, storeId);

                    return StoreDistanceResult.builder()
                            .storeId(Long.valueOf(storeId.toString()))
                            .distance(distance != null ? distance.intValue() : 0)
                            .build();
                })
                .filter(result -> result.distance() > 0)
                .sorted(Comparator.comparingInt(StoreDistanceResult::distance))
                .collect(Collectors.toList());
    }
}