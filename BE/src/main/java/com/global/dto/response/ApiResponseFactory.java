package com.global.dto.response;

import com.global.constants.SuccessCode;
import org.springframework.http.ResponseEntity;

public class ApiResponseFactory {
    
    public static <T> ResponseEntity<BaseResponse> success(SuccessCode successCode, T data) {
        return ResponseEntity.status(successCode.getStatus()).body(SuccessResponse.of(successCode, data));
    }

    public static ResponseEntity<BaseResponse> success(SuccessCode successCode) {
        return ResponseEntity.status(successCode.getStatus()).body(SuccessResponse.of(successCode, null));
    }
}
