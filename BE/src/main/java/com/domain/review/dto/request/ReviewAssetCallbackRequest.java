package com.domain.review.dto.request;

import com.domain.review.constants.ReviewAssetType;
import com.global.annotation.ExcludeFromLogging;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record ReviewAssetCallbackRequest(

        @NotNull(message = "REVIEW_ASSET_ID_REQUIRED")
        @Schema(description = "리뷰 에셋 ID", example = "1")
        Long reviewAssetId,

        @NotBlank(message = "RESULT_REQUIRED")
        @Pattern(regexp = "^(SUCCESS|FAIL)$", message = "RESULT_MUST_BE_SUCCESS_OR_FAIL")
        @Schema(description = "에셋 생성 결과 (SUCCESS 또는 FAIL)", example = "SUCCESS")
        String result,

        @Schema(description = "에셋 URL (성공 시 필수)", example = "https://cdn.example.com/asset/abc123.png")
        @ExcludeFromLogging
        String assetUrl,

        @NotNull(message = "TYPE_REQUIRED")
        @Schema(description = "에셋 타입 (IMAGE 또는 SHORTS_RAY_2 또는 SHORTS_GEN_4)", example = "IMAGE")
        ReviewAssetType type
) {
}
