package com.domain.event.dto.response;

import com.domain.event.entity.Event;
import com.domain.event.entity.EventAsset;

import java.time.LocalDateTime;

public record MyEventResponse(
        Long eventId,
        String storeName,
        String title,
        String description,
        LocalDateTime startAt,
        LocalDateTime endAt,
        String postUrl
) {
    public static MyEventResponse from(Event event, EventAsset asset) {
        return new MyEventResponse(
                event.getId(),
                event.getStore().getName(),
                event.getTitle(),
                event.getDescription(),
                event.getStartDate().atStartOfDay(),
                event.getEndDate().atTime(23, 59, 59),
                asset != null ? asset.getPath() : null
        );
    }
}
