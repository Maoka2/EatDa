package com.domain.store.service.impl;

import com.domain.review.constants.ReviewConstants;
import com.domain.review.entity.Poi;
import com.domain.review.service.PoiStoreDistanceService;
import com.domain.store.dto.request.StoreNearbyRequest;
import com.domain.store.dto.response.StoreInfo;
import com.domain.store.dto.response.StoreNearbyResponse;
import com.domain.store.service.StoreService;
import com.global.constants.ErrorCode;
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

    private final PoiStoreDistanceService poiStoreDistanceService;

    @Override
    public StoreNearbyResponse getNearbyStores(StoreNearbyRequest request, String email) {
        log.info("근처 가게 조회 요청 - 위도:{}, 경도:{}, 거리:{}", request.latitude(), request.longitude(), request.distance());
        int searchRadius = validateDistance(request.distance());

        // Poi 찾고
        Poi poi = poiStoreDistanceService.findNearestPoi(request.latitude(), request.longitude());

        // 그거 기반으로
        List<StoreInfo> nearbyStores = poiStoreDistanceService.getNearbyStores(poi.getId(), request.distance());
        return StoreNearbyResponse.of(nearbyStores, searchRadius, request.latitude(), request.longitude());
    }

    private int validateDistance(Integer distance) {
        if (distance == null) {
            return 500;
        }

        if (!ReviewConstants.SEARCH_DISTANCES.contains(distance)) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR);
        }

        return distance;
    }
}
