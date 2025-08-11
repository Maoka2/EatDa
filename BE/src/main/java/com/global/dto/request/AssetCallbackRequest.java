package com.global.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record AssetCallbackRequest<T extends Enum<T>>(

        @NotNull(message = "ASSET_ID_REQUIRED")
        Long assetId,

        @NotBlank(message = "RESULT_REQUIRED")
        @Pattern(regexp = "^(SUCCESS|FAIL)$", message = "RESULT_MUST_BE_SUCCESS_OR_FAIL")
        String result,

        String assetUrl,

        @NotNull(message = "TYPE_REQUIRED")
        T type
) {
}
