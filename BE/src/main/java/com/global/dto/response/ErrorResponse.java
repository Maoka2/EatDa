package com.global.dto.response;

import static com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.global.utils.TimestampUtils;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Builder;

@Builder(access = AccessLevel.PRIVATE) // 생성 일관성 유지 및 필드 검증을 위해 builder 접근 제한
public record ErrorResponse(
        @NotNull String code,
        @NotNull String message,
        @NotNull int status,
        @JsonInclude(NON_NULL) Object details, // 추가 에러 상세 정보 (null인 경우 JSON에서 제외)
        @NotNull String timestamp
) implements BaseResponse {

    public static ErrorResponse of(final String code, final String message, final int status, final Object details) {
        return ErrorResponse.builder()
                .code(code)
                .message(message)
                .status(status)
                .details(details)
                .timestamp(TimestampUtils.now())
                .build();
    }

    public static ErrorResponse of(final String code, final String message, final int status) {
        return ErrorResponse.builder()
                .code(code)
                .message(message)
                .status(status)
                .timestamp(TimestampUtils.now())
                .build();
    }
}
