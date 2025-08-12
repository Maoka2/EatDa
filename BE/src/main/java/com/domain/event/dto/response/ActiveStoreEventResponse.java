package com.domain.event.dto.response;

import com.domain.event.entity.EventAsset;
import com.domain.event.entity.Event;

import java.time.LocalDate;

public record ActiveStoreEventResponse(
        Long eventId,
        String title,
        LocalDate startAt,
        LocalDate endAt,
        String postUrl
) {
    public static ActiveStoreEventResponse from(Event event, EventAsset asset)  {
        return new ActiveStoreEventResponse(
                event.getId(),
                event.getTitle(),
                event.getStartDate(),
                event.getEndDate(),
                asset != null ? asset.getPath() : null
        );
    }
}
