package com.global.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.global.constants.ErrorCode;
import com.global.constants.SuccessCode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.Builder;
import lombok.Getter;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BaseResponse<T> {

    // 내부 로직에 맞춘 식별용 코드 (프론트엔드 로직 분기용)
    private final String code;

    // 사용자에게 보여질 안내 메시지
    private final String message;

    // HTTP 상태 코드와 일치 (200, 201, 400, 401 등)
    private final int status;

    // 응답 데이터 본문 (단건 객체, 배열, null 모두 가능)
    private final T data;

    // 에러 발생 시 세부 정보 (선택적) 필드 에러, 파라미터 문제 등 상세 에러 정보를 포함
    private final Object details;

    // 요청 시각 (UTC ISO8601 형식, millis 까지)
    private final String timestamp = Instant.now()
            .truncatedTo(ChronoUnit.MILLIS)
            .toString();

    @Builder
    public BaseResponse(final String code,
                        final String message,
                        final int status,
                        final T data,
                        final Object details) {
        this.code = code;
        this.message = message;
        this.status = status;
        this.data = data;
        this.details = details;
    }

    /**
     * 성공 응답 생성 - 데이터 포함
     */
    public static <T> BaseResponse<T> success(final SuccessCode successCode, final T data) {
        return BaseResponse.<T>builder()
                .code(successCode.getCode())
                .message(successCode.getMessage())
                .status(successCode.getStatus())
                .data(data)
                .build();
    }

    /**
     * 성공 응답 생성 - 데이터 없음
     */
    public static <T> BaseResponse<T> success(final SuccessCode successCode) {
        return BaseResponse.<T>builder()
                .code(successCode.getCode())
                .message(successCode.getMessage())
                .status(successCode.getStatus())
                .build();
    }

    /**
     * 에러 응답 생성 - details 포함
     */
    public static <T> BaseResponse<T> error(final ErrorCode errorCode, final Object details) {
        return BaseResponse.<T>builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .status(errorCode.getStatus())
                .details(details)
                .build();
    }

    /**
     * 에러 응답 생성 - details 없음
     */
    public static <T> BaseResponse<T> error(final ErrorCode errorCode) {
        return BaseResponse.<T>builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .status(errorCode.getStatus())
                .build();
    }
}
