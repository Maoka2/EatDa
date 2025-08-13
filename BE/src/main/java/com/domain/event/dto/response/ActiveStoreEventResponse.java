package com.domain.event.dto.response;

import com.domain.event.entity.EventAsset;
import com.domain.event.entity.Event;
import com.domain.store.entity.Store;

import java.time.LocalDate;

public record ActiveStoreEventResponse(
        Long eventId,
        String storeName,
        String title,
        String description,
        LocalDate startAt,
        LocalDate endAt,
        String postUrl
) {
    public static ActiveStoreEventResponse from(Event event, EventAsset asset, Store store)  {
        return new ActiveStoreEventResponse(
                event.getId(),
                store.getName(),
                event.getTitle(),
                event.getDescription(),
                event.getStartDate(),
                event.getEndDate(),
                asset != null ? asset.getPath() : null
        );
    }
}
