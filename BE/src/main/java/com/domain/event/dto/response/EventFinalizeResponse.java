package com.domain.event.dto.response;

import com.domain.event.entity.Event;

public record EventFinalizeResponse(
        Long eventId
) {
    public static EventFinalizeResponse from(Event event) {
        return new EventFinalizeResponse(event.getId());
    }
}
