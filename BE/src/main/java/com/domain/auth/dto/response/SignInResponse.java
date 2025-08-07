package com.domain.auth.dto.response;

public record SignInResponse(
        String accessToken,
        String refreshToken
) {
}
