package com.domain.auth.dto.response;

import com.global.annotation.Sensitive;

public record TokenResponse(
        @Sensitive
        String accessToken
) {
}
