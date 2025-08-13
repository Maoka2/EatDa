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
    STORE_NAME_REQUIRED("STORE_NAME_REQUIRED", "가게 이름은 필수 입력입니다.", HttpStatus.BAD_REQUEST.value()),
    ADDRESS_REQUIRED("ADDRESS_REQUIRED", "주소는 필수 입력입니다.", HttpStatus.BAD_REQUEST.value()),
    MENU_NAME_REQUIRED("MENU_NAME_REQUIRED", "메뉴명은 필수 입력입니다.", HttpStatus.BAD_REQUEST.value()),
    USER_NOT_FOUND("USER_NOT_FOUND", "요청한 유저 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND.value()),

    // 인증/인가 관련
    UNAUTHORIZED("UNAUTHORIZED", "인증이 필요합니다.", HttpStatus.UNAUTHORIZED.value()),
    INVALID_CREDENTIALS("INVALID_CREDENTIALS", "이메일 또는 비밀번호가 일치하지 않습니다.", HttpStatus.UNAUTHORIZED.value()),
    INVALID_TOKEN("INVALID_TOKEN", "토큰이 누락되었거나 형식이 잘못되었습니다.", HttpStatus.BAD_REQUEST.value()),
    REFRESH_TOKEN_INVALID("REFRESH_TOKEN_INVALID", "유효하지 않거나 만료된 리프레시 토큰입니다.", HttpStatus.UNAUTHORIZED.value()),
    KAKAO_TOKEN_INVALID("KAKAO_TOKEN_INVALID", "유효하지 않은 카카오 토큰입니다.", HttpStatus.UNAUTHORIZED.value()),
    GOOGLE_TOKEN_INVALID("GOOGLE_TOKEN_INVALID", "유효하지 않은 구글 토큰입니다.", HttpStatus.UNAUTHORIZED.value()),
    FORBIDDEN("FORBIDDEN", "접근 권한이 없습니다.", HttpStatus.FORBIDDEN.value()),

    // 리뷰 관련
    REVIEW_PROMPT_REQUIRED("REVIEW_PROMPT_REQUIRED", "리뷰 생성 프롬프트는 필수 입력입니다.", HttpStatus.BAD_REQUEST.value()),
    REVIEW_TYPE_INVALID("REVIEW_TYPE_INVALID", "리뷰 타입은 IMAGE 또는 SHORTS 중 하나여야 합니다.", HttpStatus.BAD_REQUEST.value()),
    REVIEW_IMAGE_REQUIRED("REVIEW_IMAGE_REQUIRED", "이미지는 1개 이상 첨부해야 합니다.", HttpStatus.BAD_REQUEST.value()),
    REVIEW_IMAGE_UNSUPPORTED_FORMAT("REVIEW_IMAGE_UNSUPPORTED_FORMAT", "지원하지 않는 이미지 형식입니다. (JPG, PNG만 허용)",
            HttpStatus.BAD_REQUEST.value()),
    REVIEW_IMAGE_TOO_LARGE("REVIEW_IMAGE_TOO_LARGE", "이미지 크기는 10MB 이하만 허용됩니다.", HttpStatus.BAD_REQUEST.value()),
    REVIEW_MENU_INVALID("REVIEW_MENU_INVALID", "선택한 메뉴는 해당 가게에 속하지 않습니다.", HttpStatus.BAD_REQUEST.value()),
    STORE_NOT_FOUND("STORE_NOT_FOUND", "요청한 가게 정보를 찾을 수 없습니다.", HttpStatus.NOT_FOUND.value()),
    REVIEW_ASSET_NOT_FOUND("REVIEW_ASSET_NOT_FOUND", "해당 리뷰 에셋 요청이 존재하지 않습니다.", HttpStatus.NOT_FOUND.value()),
    REVIEW_CALLBACK_RESULT_INVALID("REVIEW_CALLBACK_RESULT_INVALID", "콜백 결과는 SUCCESS 또는 FAIL 이어야 합니다.",
            HttpStatus.BAD_REQUEST.value()),
    REVIEW_ASSET_URL_REQUIRED("REVIEW_ASSET_URL_REQUIRED", "성공 시 에셋 URL은 필수 입력입니다.", HttpStatus.BAD_REQUEST.value()),
    REVIEW_ASSET_URL_INVALID_FORMAT("REVIEW_ASSET_URL_INVALID_FORMAT", "에셋 URL 형식이 유효하지 않습니다.",
            HttpStatus.BAD_REQUEST.value()),
    REVIEW_NOT_FOUND("REVIEW_NOT_FOUND", "리뷰가 존재하지 않습니다.", HttpStatus.NOT_FOUND.value()),
    REVIEW_NOT_SUCCESS("REVIEW_NOT_SUCCESS", "해당 리뷰는 성공 상태가 아닙니다.", HttpStatus.BAD_REQUEST.value()),
    REVIEW_DESCRIPTION_TOO_SHORT("REVIEW_DESCRIPTION_TOO_SHORT", "리뷰 설명은 최소 30자 이상이어야 합니다.",
            HttpStatus.BAD_REQUEST.value()),
    REVIEW_INVALID_STATUS("REVIEW_INVALID_STATUS", "유효하지 않은 리뷰 상태입니다.", HttpStatus.BAD_REQUEST.value()),
    REVIEW_ASSET_NOT_READY("REVIEW_ASSET_NOT_READY", "리뷰 에셋이 아직 준비되지 않았습니다.", HttpStatus.BAD_REQUEST.value()),
    REVIEW_ASSET_TYPE_MISMATCH("REVIEW_ASSET_TYPE_MISMATCH", "요청한 리뷰 에셋 타입이 일치하지 않습니다.",
            HttpStatus.BAD_REQUEST.value()),
    REVIEW_OWNER_MISMATCH("REVIEW_OWNER_MISMATCH", "리뷰 소유자가 일치하지 않습니다.", HttpStatus.FORBIDDEN.value()),

    // 리소스 관련
    NOT_FOUND("NOT_FOUND", "요청한 파일이 존재하지 않습니다.", HttpStatus.NOT_FOUND.value()),
    RESOURCE_NOT_FOUND("RESOURCE_NOT_FOUND", "요청한 리소스를 찾을 수 없습니다.", HttpStatus.NOT_FOUND.value()),
    SCRAP_NOT_FOUND("SCRAP_NOT_FOUND", "해당 스크랩을 찾을 수 없습니다.", HttpStatus.NOT_FOUND.value()),
    INVALID_STATUS("INVALID_STATUS", "유효하지 않은 상태값입니다.", HttpStatus.BAD_REQUEST.value()),
    IMAGE_TOO_LARGE("IMAGE_TOO_LARGE", "이미지 크기는 10MB 이하만 허용됩니다.", HttpStatus.BAD_REQUEST.value()),

    // 이벤트 관련
    EVENT_NOT_FOUND("EVENT_NOT_FOUND", "요청한 이벤트를 찾을 수 없습니다.", HttpStatus.NOT_FOUND.value()),
    EVENT_NOT_PENDING("EVENT_NOT_PENDING", "해당 이벤트는 보류 상태가 아닙니다.", HttpStatus.BAD_REQUEST.value()),
    INVALID_EVENT_DATE_RANGE("INVALID_EVENT_DATE_RANGE", "시작일은 종료일보다 이전이어야 합니다.", HttpStatus.BAD_REQUEST.value()),
    REQUIRED_EVENT_FIELDS_MISSING("REQUIRED_EVENT_FIELDS_MISSING",
            "assetId, type, prompt, storeId, userId, title, startDate, endDate는 필수입니다.",
            HttpStatus.BAD_REQUEST.value()),
    EVENT_INVALID_DATE_RANGE("EVENT_INVALID_DATE_RANGE", "시작 날짜가 종료 날짜보다 늦을 수 없습니다.", HttpStatus.BAD_REQUEST.value()),
    EVENT_START_DATE_IN_PAST("EVENT_START_DATE_IN_PAST", "시작 날짜는 과거일 수 없습니다.", HttpStatus.BAD_REQUEST.value()),

    // asset 관련
    ASSET_NOT_FOUND("ASSET_NOT_FOUND", "해당 에셋이 존재하지 않습니다.", HttpStatus.NOT_FOUND.value()),
    ASSET_NOT_SUCCESS("ASSET_NOT_SUCCESS", "해당 에셋은 성공 상태가 아닙니다.", HttpStatus.BAD_REQUEST.value()),
    ASSET_URL_REQUIRED("ASSET_URL_REQUIRED", "성공 시 에셋 URL은 필수 입력입니다.", HttpStatus.BAD_REQUEST.value()),
    ASSET_TYPE_MISMATCH("ASSET_TYPE_MISMATCH", "요청한 에셋 타입이 일치하지 않습니다.", HttpStatus.BAD_REQUEST.value()),
    ASSET_TYPE_REQUIRED("ASSET_TYPE_REQUIRED", "에셋 타입이 설정되지 않았습니다.", HttpStatus.INTERNAL_SERVER_ERROR.value()),

    // 메뉴 관련 에러 코드
    MENU_NOT_FOUND("MENU_NOT_FOUND", "요청한 메뉴를 찾을 수 없습니다.", HttpStatus.NOT_FOUND.value()),
    MENU_NOT_BELONG_TO_STORE("MENU_NOT_BELONG_TO_STORE", "선택한 메뉴가 해당 가게에 속하지 않습니다.", HttpStatus.BAD_REQUEST.value()),
    MENU_IDS_REQUIRED("MENU_IDS_REQUIRED", "메뉴 ID 목록은 필수 입력입니다.", HttpStatus.BAD_REQUEST.value()),

    // 메뉴 포스터 관련 에러 코드
    MENU_POSTER_NOT_FOUND("MENU_POSTER_NOT_FOUND", "요청한 메뉴 포스터를 찾을 수 없습니다.", HttpStatus.NOT_FOUND.value()),
    MENU_POSTER_NOT_PENDING("MENU_POSTER_NOT_PENDING", "해당 메뉴 포스터는 대기 상태가 아닙니다.", HttpStatus.BAD_REQUEST.value()),
    MENU_POSTER_NOT_SUCCESS("MENU_POSTER_NOT_SUCCESS", "해당 메뉴 포스터는 완료 상태가 아닙니다.", HttpStatus.BAD_REQUEST.value()),
    MENU_POSTER_ASSET_NOT_FOUND("MENU_POSTER_ASSET_NOT_FOUND", "해당 메뉴 포스터 에셋이 존재하지 않습니다.", HttpStatus.NOT_FOUND.value()),
    REQUIRED_MENU_FIELDS_MISSING("REQUIRED_MENU_FIELDS_MISSING", "assetId, type, prompt, storeId, userId, menus, imagesUrls는 필수입니다.", HttpStatus.BAD_REQUEST.value()),
    MENU_POSTER_ALREADY_SENT("MENU_POSTER_ALREADY_SENT", "이미 전송된 메뉴 포스터입니다.", HttpStatus.BAD_REQUEST.value()),
    MENU_POSTER_NOT_SENT("MENU_POSTER_NOT_SENT", "전송되지 않은 메뉴 포스터는 채택할 수 없습니다.", HttpStatus.BAD_REQUEST.value()),
    MENU_POSTER_EXCEED_LIMIT("MENU_POSTER_EXCEED_LIMIT", "메뉴 포스터는 최대 5개까지만 선택 가능합니다.", HttpStatus.BAD_REQUEST.value()),

    // 비즈니스 로직 관련
    DUPLICATE_RESOURCE("DUPLICATE_RESOURCE", "이미 존재하는 리소스입니다.", HttpStatus.CONFLICT.value()),

    // 파일 처리 관련
    FILE_NOT_FOUND("FILE_NOT_FOUND", "해당 파일이 존재하지 않습니다.", HttpStatus.NOT_FOUND.value()),
    FILE_READ_ERROR("FILE_READ_ERROR", "해당 파일을 읽을 수 없습니다", HttpStatus.INTERNAL_SERVER_ERROR.value()),
    FILE_UPLOAD_ERROR("FILE_UPLOAD_ERROR", "파일 업로드에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR.value()),
    FILE_DOWNLOAD_ERROR("FILE_DOWNLOAD_ERROR", "파일 다운로드에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR.value()),
    INVALID_FILE_TYPE("INVALID_FILE_TYPE", "지원하지 않는 파일 형식입니다.", HttpStatus.BAD_REQUEST.value()),
    FILE_SIZE_EXCEEDED("FILE_SIZE_EXCEEDED", "파일 크기가 제한을 초과했습니다.", HttpStatus.BAD_REQUEST.value()),
    IMAGE_PROCESSING_FAILED("IMAGE_PROCESSING_FAILED", "이미지 처리에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR.value()),
    VIDEO_PROCESSING_FAILED("VIDEO_PROCESSING_FAILED", "비디오 처리에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR.value()),

    // 영상 후처리 관련
    PROTOCOL_FORMAT_ERROR("PROTOCOL_FORMAT", "HTTP(S) URL만 지원합니다", HttpStatus.BAD_REQUEST.value()),
    THUMBNAIL_GENERATE_ERROR("THUMBNAIL_GENERATE_ERROR", "썸네일 생성 도중 에러가 발생했습니다.",
            HttpStatus.INTERNAL_SERVER_ERROR.value()),
    THUMBNAIL_PATH_ERROR("THUMBNAIL_PATH_ERROR", "썸네일 생성 경로 생성에 에러가 발생했습니다.", HttpStatus.BAD_REQUEST.value()),

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
