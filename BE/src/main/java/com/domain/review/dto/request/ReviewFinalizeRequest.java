package com.domain.review.dto.request;

import com.domain.review.constants.ReviewAssetType;
import com.global.annotation.ExcludeFromLogging;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

@Schema(description = "리뷰 최종 등록 요청")
public record ReviewFinalizeRequest(

        @NotNull(message = "REVIEW_ID_REQUIRED")
        @Schema(description = "대상 리뷰 ID", example = "1")
        Long reviewId,

        @NotNull(message = "REVIEW_ASSET_ID_REQUIRED")
        @Schema(description = "연결할 리뷰 에셋 ID", example = "1")
        Long reviewAssetId,

        @NotEmpty(message = "MENU_IDS_REQUIRED")
        @Schema(description = "리뷰에 포함될 메뉴 ID 목록", example = "[2, 5]")
        List<Long> menuIds,

        @NotBlank(message = "DESCRIPTION_REQUIRED")
        @Size(min = 30, message = "DESCRIPTION_TOO_SHORT")
        @Schema(description = "리뷰 본문 (30자 이상)", example = "매콤한 소스와 바삭한 도우의 조화가 일품이었어요! 맛있어요 맛있어요 진짜 맛있어요 30자 너무 길어요")
        @ExcludeFromLogging
        String description,

        @NotNull(message = "TYPE_REQUIRED")
        @Schema(description = "리뷰 에셋 타입 (IMAGE 또는 SHORTS_RAY_2 또는 SHORTS_GEN_4)", example = "IMAGE")
        ReviewAssetType type
) {
}

