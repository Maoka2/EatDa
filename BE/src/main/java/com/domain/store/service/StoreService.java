package com.domain.store.service;

import com.domain.store.dto.request.StoreNearbyRequest;
import com.domain.store.dto.response.StoreNearbyResponse;

public interface StoreService {

    StoreNearbyResponse getNearbyStores(StoreNearbyRequest request, String email);
}
