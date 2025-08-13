package com.domain.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record MakerSignUpMenuRequest(

        @NotBlank(message = "MENU_NAME_REQUIRED")
        @Schema(description = "메뉴 이름", example = "제육덮밥")
        String name,

        @Schema(description = "메뉴 가격", example = "8500")
        Integer price,

        @Schema(description = "메뉴 설명", example = "매콤한 맛이 일품인 제육덮밥")
        String description
) {
}
