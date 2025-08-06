package com.global.constants;

import java.util.Optional;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@RequiredArgsConstructor
@Getter
public enum ErrorCode {

    // 공통 에러
    VALIDATION_ERROR("VALIDATION_ERROR", "입력값이 유효하지 않습니다.", HttpStatus.BAD_REQUEST.value()),
    BAD_REQUEST("BAD_REQUEST", "잘못된 요청입니다.", HttpStatus.BAD_REQUEST.value()),
    INVALID_FORMAT("INVALID_FORMAT", "요청 형식이 올바르지 않습니다.", HttpStatus.BAD_REQUEST.value()),
    METHOD_NOT_ALLOWED("METHOD_NOT_ALLOWED", "지원하지 않는 HTTP 메소드입니다.", HttpStatus.METHOD_NOT_ALLOWED.value()),
    INTERNAL_SERVER_ERROR("INTERNAL_SERVER_ERROR", "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            HttpStatus.INTERNAL_SERVER_ERROR.value()),

    // 유저 관련
    EMAIL_REQUIRED("EMAIL_REQUIRED", "이메일은 필수 입력입니다.", HttpStatus.BAD_REQUEST.value()),
    EMAIL_DUPLICATED("EMAIL_DUPLICATED", "이미 사용 중인 이메일입니다.", HttpStatus.CONFLICT.value()),
    EMAIL_INVALID_FORMAT("EMAIL_INVALID_FORMAT", "유효하지 않은 이메일 형식입니다.", HttpStatus.BAD_REQUEST.value()),
    PASSWORD_REQUIRED("PASSWORD_REQUIRED", "비밀번호는 필수 입력입니다.", HttpStatus.BAD_REQUEST.value()),
    PASSWORD_TOO_SHORT("PASSWORD_TOO_SHORT", "비밀번호는 최소 8자 이상 작성해야 합니다.", HttpStatus.BAD_REQUEST.value()),
    CONFIRM_PASSWORD_REQUIRED("CONFIRM_PASSWORD_REQUIRED", "비밀번호 확인은 필수 입력입니다.", HttpStatus.BAD_REQUEST.value()),
    CONFIRM_PASSWORD_MISMATCH("CONFIRM_PASSWORD_MISMATCH", "비밀번호와 비밀번호 확인이 일치하지 않습니다.", HttpStatus.BAD_REQUEST.value()),
    NICKNAME_REQUIRED("NICKNAME_REQUIRED", "닉네임은 필수 입력입니다.", HttpStatus.BAD_REQUEST.value()),
    NICKNAME_DUPLICATED("NICKNAME_DUPLICATED", "이미 사용 중인 닉네임입니다.", HttpStatus.CONFLICT.value()),

    // 인증/인가 관련
    UNAUTHORIZED("UNAUTHORIZED", "인증이 필요합니다.", HttpStatus.UNAUTHORIZED.value()),
    INVALID_CREDENTIALS("INVALID_CREDENTIALS", "이메일 또는 비밀번호가 일치하지 않습니다.", HttpStatus.UNAUTHORIZED.value()),
    KAKAO_TOKEN_INVALID("KAKAO_TOKEN_INVALID", "유효하지 않은 카카오 토큰입니다.", HttpStatus.UNAUTHORIZED.value()),
    GOOGLE_TOKEN_INVALID("GOOGLE_TOKEN_INVALID", "유효하지 않은 구글 토큰입니다.", HttpStatus.UNAUTHORIZED.value()),
    REFRESH_TOKEN_INVALID("REFRESH_TOKEN_INVALID", "유효하지 않거나 만료된 리프레시 토큰입니다.", HttpStatus.UNAUTHORIZED.value()),
    FORBIDDEN("FORBIDDEN", "접근 권한이 없습니다.", HttpStatus.FORBIDDEN.value()),

    // 리소스 관련
    NOT_FOUND("NOT_FOUND", "요청한 파일이 존재하지 않습니다.", HttpStatus.NOT_FOUND.value()),
    RESOURCE_NOT_FOUND("RESOURCE_NOT_FOUND", "요청한 리소스를 찾을 수 없습니다.", HttpStatus.NOT_FOUND.value()),

    // 비즈니스 로직 관련
    DUPLICATE_RESOURCE("DUPLICATE_RESOURCE", "이미 존재하는 리소스입니다.", HttpStatus.CONFLICT.value()),

    // 파일 처리 관련
    FILE_UPLOAD_ERROR("FILE_UPLOAD_ERROR", "파일 업로드에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR.value()),
    INVALID_FILE_TYPE("INVALID_FILE_TYPE", "지원하지 않는 파일 형식입니다.", HttpStatus.BAD_REQUEST.value()),
    FILE_SIZE_EXCEEDED("FILE_SIZE_EXCEEDED", "파일 크기가 제한을 초과했습니다.", HttpStatus.BAD_REQUEST.value()),
    IMAGE_PROCESSING_FAILED("IMAGE_PROCESSING_FAILED", "이미지 처리에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR.value()),
    VIDEO_PROCESSING_FAILED("VIDEO_PROCESSING_FAILED", "비디오 처리에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR.value()),

    // 외부 서비스 통신 관련
    EXTERNAL_SERVICE_ERROR("EXTERNAL_SERVICE_ERROR", "외부 서비스 연동 중 오류가 발생했습니다.",
            HttpStatus.INTERNAL_SERVER_ERROR.value());

    private final String code;
    private final String message;
    private final int status;

    /**
     * 주어진 이름으로 ErrorCode를 조회하며, 존재하지 않으면 Optional.empty()를 반환한다.
     */
    public static Optional<ErrorCode> safeValueOf(String name) {
        try {
            return Optional.of(ErrorCode.valueOf(name));
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
