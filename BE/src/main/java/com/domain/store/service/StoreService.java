package com.domain.store.service;

import com.domain.store.dto.request.StoreNearbyRequest;
import com.domain.store.dto.response.StoreNearbyResponse;
import com.domain.store.entity.Store;

public interface StoreService {

    StoreNearbyResponse getNearbyStores(StoreNearbyRequest request, String email);

    Store getStore(Long storeId);
}
