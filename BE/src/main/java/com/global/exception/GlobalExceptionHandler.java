package com.global.exception;

import static com.global.constants.Messages.INVALID_INPUT;
import static com.global.utils.PathUtils.extractLeafProperty;

import com.global.constants.ErrorCode;
import com.global.dto.response.BaseResponse;
import com.global.dto.response.ErrorResponse;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 전역 예외 핸들러 - 서비스 전체에서 발생하는 예외를 일관된 형식으로 처리한다.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 비즈니스 예외 처리
     */
    @ExceptionHandler(GlobalException.class)
    public ResponseEntity<BaseResponse> handleGlobalException(final GlobalException e) {
        return buildErrorResponse(e.getErrorCode(), e.getDetails());
    }

    /**
     * @Valid, @Validated 유효성 검증 실패 처리
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<BaseResponse> handleValidationException(
            final MethodArgumentNotValidException e) {
        var details = extractFieldErrors(e);
        return buildErrorResponse(ErrorCode.VALIDATION_ERROR, details);
    }

    /**
     * URI 파라미터 등의 제약조건 검증 실패 처리
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<BaseResponse> handleConstraintViolationException(
            final ConstraintViolationException e) {
        var details = extractConstraintViolations(e);
        return buildErrorResponse(ErrorCode.VALIDATION_ERROR, details);
    }

    /**
     * 잘못된 JSON 형식 등 본문 파싱 실패
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<BaseResponse> handleInvalidFormat(final HttpMessageNotReadableException e) {
        return buildErrorResponse(ErrorCode.INVALID_FORMAT);
    }

    /**
     * 허용되지 않은 HTTP 메서드 요청 처리
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<BaseResponse> handleMethodNotAllowed(
            final HttpRequestMethodNotSupportedException e) {
        return buildErrorResponse(ErrorCode.METHOD_NOT_ALLOWED);
    }

    /**
     * 정의되지 않은 모든 예외 처리
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<BaseResponse> handleUncaughtException(final Exception e) {
        return buildErrorResponse(ErrorCode.INTERNAL_SERVER_ERROR);
    }

    /**
     * 에러 응답 공통 생성 로직 - details 포함
     */
    private ResponseEntity<BaseResponse> buildErrorResponse(final ErrorCode code, final Object details) {
        var body = ErrorResponse.of(code.getCode(), code.getMessage(), code.getStatus(), details);
        return ResponseEntity.status(code.getStatus()).body(body);
    }

    /**
     * 에러 응답 공통 생성 로직 - details 없음
     */
    private ResponseEntity<BaseResponse> buildErrorResponse(final ErrorCode code) {
        var body = ErrorResponse.of(code.getCode(), code.getMessage(), code.getStatus());
        return ResponseEntity.status(code.getStatus()).body(body);
    }

    /**
     * 필드 유효성 검증 오류 메시지 추출
     */
    private Map<String, String> extractFieldErrors(final MethodArgumentNotValidException e) {
        return e.getBindingResult()
                .getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> Optional.ofNullable(error.getDefaultMessage())
                                .orElse(INVALID_INPUT.message()),
                        (first, second) -> first // 중복 필드는 첫 번째 메시지 유지
                ));
    }

    /**
     * 제약조건 위반 오류 메시지 추출
     */
    private Map<String, String> extractConstraintViolations(final ConstraintViolationException e) {
        return e.getConstraintViolations()
                .stream()
                .collect(Collectors.toMap(
                        violation -> extractLeafProperty(violation.getPropertyPath().toString()),
                        ConstraintViolation::getMessage,
                        (first, second) -> first
                ));
    }
}
