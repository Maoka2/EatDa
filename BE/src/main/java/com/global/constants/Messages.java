package com.global.constants;

import lombok.Getter;

@Getter
public enum Messages {
    // 유효성 검증 메시지
    INVALID_INPUT("잘못된 입력입니다."),

    // API 문서 관련 메시지
    API_TITLE("EatDa API Document"),
    API_DESCRIPTION("잇다 API 명세서"),
    API_VERSION("1.0.0"),

    // 서버 URL 정보
    LOCAL_SERVER_URL("http://localhost:8080"),
    DEV_SERVER_URL("https://eatda.com"),

    // 보안 인증 관련
    SECURITY_SCHEME_NAME("BearerAuthentication"),
    BEARER_FORMAT("JWT"),
    BEARER_SCHEME("bearer");

    private final String message;

    Messages(String message) {
        this.message = message;
    }
}
