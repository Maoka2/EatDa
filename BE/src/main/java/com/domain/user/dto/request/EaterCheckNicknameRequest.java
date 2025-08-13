package com.domain.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record EaterCheckNicknameRequest(

        @NotBlank(message = "NICKNAME_REQUIRED")
        @Schema(description = "닉네임", example = "우갸갹!")
        String nickname
) {
}
