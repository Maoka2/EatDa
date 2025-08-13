package com.domain.review.dto.request;

import com.domain.review.constants.ReviewAssetType;
import com.global.annotation.ExcludeFromLogging;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public record ReviewAssetCreateRequest(

        @NotNull(message = "STORE_ID_REQUIRED")
        @Schema(description = "리뷰 대상 가게 ID", example = "1")
        Long storeId,

        @NotEmpty(message = "MENU_IDS_REQUIRED")
        @Schema(description = "선택한 메뉴 ID 목록", example = "[2, 5]")
        List<@NotNull Long> menuIds,

        @NotNull(message = "ASSET_TYPE_REQUIRED")
        @Schema(description = "에셋 타입 (IMAGE 또는 SHORTS_RAY_2 또는 SHORTS_GEN_4)", example = "IMAGE")
        ReviewAssetType type,

        @NotBlank(message = "PROMPT_REQUIRED")
        @Schema(description = "프롬프트 내용", example = "치즈가 녹아내리는 피자")
        String prompt,

        @NotEmpty(message = "IMAGES_REQUIRED")
        @Schema(description = "참고 이미지 목록 (최대 10MB, 최소 1개)", type = "array", implementation = MultipartFile.class)
        @ExcludeFromLogging
        List<@NotNull MultipartFile> image
) {
}
