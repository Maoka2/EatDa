package com.domain.event.dto.response;

import java.time.LocalDateTime;

public record EventGetResponse(
        String title,
        String description,
        LocalDateTime startDate,
        LocalDateTime endDate,
        String imageUrl
) {
}
