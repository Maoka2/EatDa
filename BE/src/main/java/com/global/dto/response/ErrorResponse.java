package com.global.dto.response;

import static com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL;
import static com.global.utils.TimestampUtils.now;
import static lombok.AccessLevel.PRIVATE;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder(access = PRIVATE) // 생성 일관성 유지 및 필드 검증을 위해 builder 접근 제한
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
                .timestamp(now())
                .build();
    }

    public static ErrorResponse of(final String code, final String message, final int status) {
        return ErrorResponse.builder()
                .code(code)
                .message(message)
                .status(status)
                .timestamp(now())
                .build();
    }
}
