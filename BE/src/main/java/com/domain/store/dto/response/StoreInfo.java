package com.domain.store.dto.response;

public record StoreInfo(
        Long id,
        String name,
        Double latitude,
        Double longitude,
        Integer distance
) {
}
