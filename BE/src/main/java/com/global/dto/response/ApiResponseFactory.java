package com.global.dto.response;

import com.global.constants.ErrorCode;
import com.global.constants.SuccessCode;
import org.springframework.http.ResponseEntity;

public class ApiResponseFactory {

    public static <T> ResponseEntity<BaseResponse> success(SuccessCode successCode, T data) {
        return ResponseEntity.status(successCode.getStatus()).body(SuccessResponse.of(successCode, data));
    }

    public static ResponseEntity<BaseResponse> success(SuccessCode successCode) {
        return ResponseEntity.status(successCode.getStatus()).body(SuccessResponse.of(successCode));
    }

    public static <T> ResponseEntity<BaseResponse> fail(ErrorCode errorCode, T data) {
        return ResponseEntity.status(errorCode.getStatus()).body(ErrorResponse.of(errorCode, data));
    }

    public static ResponseEntity<BaseResponse> fail(ErrorCode errorCode) {
        return ResponseEntity.status(errorCode.getStatus()).body(ErrorResponse.of(errorCode));
    }
}
