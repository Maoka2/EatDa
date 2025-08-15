package com.domain.store.service.impl;

import com.domain.common.entity.Poi;
import com.domain.common.service.SpatialSearchService;
import com.domain.store.dto.request.StoreNearbyRequest;
import com.domain.store.dto.response.StoreInfo;
import com.domain.store.dto.response.StoreNearbyResponse;
import com.domain.store.service.StoreService;
import com.global.constants.ErrorCode;
import com.global.constants.SearchDistance;
import com.global.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoreServiceImpl implements StoreService {

    private final SpatialSearchService spatialSearchService;

    @Override
    public StoreNearbyResponse getNearbyStores(StoreNearbyRequest request, String email) {
        log.info("근처 가게 조회 요청 - 위도:{}, 경도:{}, 거리:{}", request.latitude(), request.longitude(), request.distance());
        SearchDistance searchRadius = validateDistance(request.distance());

        // Poi 찾고
        Poi poi = spatialSearchService.findNearestPoi(request.latitude(), request.longitude());

        // 그거 기반으로
        List<StoreInfo> nearbyStores = spatialSearchService.getNearbyStores(poi.getId(), request.distance());
        return StoreNearbyResponse.of(nearbyStores, searchRadius.getMeters(), poi.getLatitude(), poi.getLongitude());
    }

    private SearchDistance validateDistance(Integer distance) {
        if (distance == null) {
            return SearchDistance.getDefault();
        }

        return SearchDistance.find(distance)
                .orElseThrow(() -> {
                    log.warn("잘못된 검색 거리 요청: {}m", distance);
                    return new ApiException(ErrorCode.VALIDATION_ERROR);
                });
    }
}
