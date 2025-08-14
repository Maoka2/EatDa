package com.domain.store.event;

import java.time.LocalDateTime;

public record StoreCreatedEvent(
        Long storeId,
        Double latitude,
        Double longitude,
        Long h3Index7,
        Long h3Index8,
        Long h3Index9,
        Long h3Index10,
        LocalDateTime createdAt
) {
    public static StoreCreatedEvent of(Long storeId, Double latitude, Double longitude,
                                       Long h3Index7, Long h3Index8, Long h3Index9, Long h3Index10) {
        return new StoreCreatedEvent(
                storeId, latitude, longitude,
                h3Index7, h3Index8, h3Index9, h3Index10,
                LocalDateTime.now()
        );
    }
}
