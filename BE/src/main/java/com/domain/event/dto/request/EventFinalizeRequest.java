package com.domain.event.dto.request;

import com.global.constants.AssetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EventFinalizeRequest(

        @NotNull(message = "EVENT_ID_REQUIRED")
        Long eventId,

        @NotNull(message = "EVENT_ASSET_ID_REQUIRED")
        Long eventAssetId,

        @NotBlank(message = "DESCRIPTION_REQUIRED")
        String description,

        @NotNull(message = "TYPE_REQUIRED")
        AssetType type
) {
}
