package com.domain.auth.dto.response;

import com.global.annotation.Sensitive;

public record SignInResponse(
        @Sensitive
        String accessToken,

        @Sensitive
        String refreshToken
) {
}
