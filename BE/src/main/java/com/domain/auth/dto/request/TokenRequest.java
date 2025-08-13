package com.domain.auth.dto.request;

import com.global.annotation.Sensitive;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record TokenRequest(

        @NotBlank(message = "UNAUTHORIZED")
        @Schema(description = "리프레시 토큰")
        @Sensitive
        String refreshToken
) {
}
