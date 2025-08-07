package com.global.constants;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@RequiredArgsConstructor
@Getter
public enum SuccessCode {

    // 냠냠이
    EATER_SIGNUP("EATER_SIGNUP", "회원가입이 완료되었습니다.", HttpStatus.CREATED.value()),
    EMAIL_AVAILABLE("EMAIL_AVAILABLE", "사용 가능한 이메일입니다.", HttpStatus.OK.value()),
    NICKNAME_AVAILABLE("NICKNAME_AVAILABLE", "사용 가능한 닉네임입니다.", HttpStatus.OK.value()),

    // 사장님 회원가입 단계
    MAKER_SIGNUP_STEP1("MAKER_SIGNUP_STEP1", "기본 정보가 저장되었습니다.", HttpStatus.CREATED.value()),
    MENU_EXTRACTION_RECEIVED("MENU_EXTRACTION_RECEIVED", "메뉴 추출 결과가 수신되었습니다.", HttpStatus.OK.value()),
    MENU_EXTRACTION_SUCCESS("MENU_EXTRACTION_SUCCESS", "메뉴 추출이 성공적으로 완료되었습니다.", HttpStatus.OK.value()),
    MENU_EXTRACTION_PENDING("MENU_EXTRACTION_PENDING", "메뉴 추출이 아직 처리 중입니다.", HttpStatus.OK.value()),
    MENU_EXTRACTION_FAILED("MENU_EXTRACTION_FAILED", "메뉴 추출에 실패했습니다.", HttpStatus.OK.value()),
    MAKER_SIGNUP_STEP2("MAKER_SIGNUP_STEP2", "메뉴가 성공적으로 등록되었습니다.", HttpStatus.CREATED.value()),
    MAKER_SIGNUP_STEP3("MAKER_SIGNUP_STEP3", "사장님 회원가입이 완료되었습니다.", HttpStatus.OK.value()),

    MAKER_SIGNUP("MAKERS_SIGNUP", "사장님 회원가입이 완료되었습니다.", HttpStatus.OK.value()),

    // 로그인 / 권한
    SIGN_IN_SUCCESS("SIGN_IN_SUCCESS", "로그인에 성공했습니다.", HttpStatus.OK.value()),
    TOKEN_REFRESHED("TOKEN_REFRESHED", "토큰이 갱신되었습니다.", HttpStatus.OK.value()),
    SIGN_OUT_SUCCESS("SIGN_OUT_SUCCESS", "로그아웃이 완료되었습니다.", HttpStatus.OK.value()),
    WITHDRAWAL_SUCCESS("WITHDRAWAL_SUCCESS", "회원 탈퇴가 완료되었습니다.", HttpStatus.OK.value()),

    // 리뷰 관련
    OCR_VERIFICATION_REQUESTED("OCR_VERIFICATION_REQUESTED", "OCR 인증 요청이 등록되었습니다.", HttpStatus.ACCEPTED.value()),
    OCR_VERIFICATION_RECEIVED("OCR_VERIFICATION_RECEIVED", "OCR 결과가 수신되었습니다.", HttpStatus.OK.value()),
    OCR_VERIFICATION_SUCCESS("OCR_VERIFICATION_SUCCESS", "OCR 인증에 성공했습니다.", HttpStatus.OK.value()),
    OCR_VERIFICATION_PENDING("OCR_VERIFICATION_PENDING", "OCR 인증이 아직 처리 중입니다.", HttpStatus.OK.value()),
    OCR_VERIFICATION_FAILED("OCR_VERIFICATION_FAILED", "OCR 인증에 실패했습니다.", HttpStatus.OK.value()),
    REVIEW_ASSET_REQUESTED("REVIEW_ASSET_REQUESTED", "리뷰 에셋 생성 요청이 등록되었습니다.", HttpStatus.ACCEPTED.value()),
    REVIEW_ASSET_RECEIVED("REVIEW_ASSET_RECEIVED", "리뷰 에셋이 수신되었습니다.", HttpStatus.OK.value()),
    REVIEW_ASSET_GENERATION_SUCCESS("REVIEW_ASSET_GENERATION_SUCCESS", "리뷰 에샛 생성이 완료되었습니다.", HttpStatus.OK.value()),
    REVIEW_ASSET_GENERATION_PENDING("REVIEW_ASSET_GENERATION_PENDING", "리뷰 에셋이 아직 처리 중입니다.", HttpStatus.OK.value()),
    REVIEW_ASSET_GENERATION_FAILED("REVIEW_ASSET_GENERATION_FAILED", "리뷰 에셋 생성에 실패했습니다.", HttpStatus.OK.value()),
    REVIEW_REGISTERED("REVIEW_REGISTERED", "리뷰가 성공적으로 등록되었습니다.", HttpStatus.OK.value()),
    FEED_FETCHED("FEED_FETCHED", "리뷰 피드가 성공적으로 조회되었습니다.", HttpStatus.OK.value()),
    FEED_FALLBACK("FEED_FALLBACK", "주변에 리뷰가 없어 전체 피드를 제공합니다.", HttpStatus.OK.value()),
    REVIEW_DETAIL_FETCHED("REVIEW_DETAIL_FETCHED", "리뷰 상세정보를 성공적으로 조회했습니다.", HttpStatus.OK.value()),
    MY_REVIEWS_FETCHED("MY_REVIEWS_FETCHED", "사용자가 작성한 리뷰 목록을 성공적으로 조회했습니다.", HttpStatus.OK.value()),
    REVIEW_SCRAP_SUCCESS("REVIEW_SCRAP_SUCCESS", "리뷰를 스크랩했습니다.", HttpStatus.CREATED.value()),
    REVIEW_UN_SCRAP_SUCCESS("REVIEW_UN_SCRAP_SUCCESS", "리뷰 스크랩이 해제되었습니다.", HttpStatus.OK.value()),
    REVIEW_DELETED("REVIEW_DELETED", "리뷰가 성공적으로 삭제되었습니다.", HttpStatus.OK.value()),

    // 매뉴판
    POSTER_REQUESTED("POSTER_REQUESTED", "메뉴 포스터 생성 요청이 접수되었습니다.", HttpStatus.ACCEPTED.value()),
    POSTER_RECEIVED("POSTER_RECEIVED", "메뉴 포스터 에셋이 수신되었습니다.", HttpStatus.OK.value()),
    POSTER_GENERATION_SUCCESS("POSTER_GENERATION_SUCCESS", "포스터가 성공적으로 생성되었습니다.", HttpStatus.OK.value()),
    POSTER_GENERATION_PENDING("POSTER_GENERATION_PENDING", "포스터가 아직 생성 중입니다.", HttpStatus.OK.value()),
    POSTER_GENERATION_FAILED("POSTER_GENERATION_FAILED", "포스터 생성에 실패했습니다.", HttpStatus.OK.value()),
    POSTER_FINALIZED("POSTER_FINALIZED", "포스터가 성공적으로 저장되었습니다.", HttpStatus.OK.value()),
    POSTER_SENT("POSTER_SENT", "포스터가 성공적으로 사장님에게 전송되었습니다.", HttpStatus.OK.value()),
    POSTERS_ADOPTED("POSTERS_ADOPTED", "선택한 메뉴판을 성공적으로 채택했습니다.", HttpStatus.OK.value()),
    POSTER_UNADOPTED("POSTER_UNADOPTED", "메뉴판이 성공적으로 채택 해제되었습니다.", HttpStatus.OK.value()),

    // 이벤트
    EVENT_ASSET_REQUESTED("EVENT_ASSET_REQUESTED", "이벤트 생성 요청이 접수되었습니다.", HttpStatus.ACCEPTED.value()),
    EVENT_ASSET_RECEIVED("EVENT_ASSET_RECEIVED", "이벤트 에셋이 수신되었습니다.", HttpStatus.OK.value()),
    ASSET_GENERATION_SUCCESS("ASSET_GENERATION_SUCCESS", "이벤트 에셋 생성이 완료되었습니다.", HttpStatus.OK.value()),
    ASSET_GENERATION_PENDING("ASSET_GENERATION_PENDING", "이벤트 에셋이 아직 처리 중입니다.", HttpStatus.OK.value()),
    ASSET_GENERATION_FAILED("ASSET_GENERATION_FAILED", "이벤트 에셋 생성에 실패했습니다.", HttpStatus.OK.value()),
    EVENT_REGISTERED("EVENT_REGISTERED", "이벤트가 성공적으로 등록되었습니다.", HttpStatus.OK.value()),
    EVENT_LIST_RETRIEVED("EVENT_LIST_RETRIEVED", "이벤트 목록이 성공적으로 조회되었습니다.", HttpStatus.OK.value()),
    ACTIVE_STORE_EVENTS_FETCHED("ACTIVE_STORE_EVENTS_FETCHED", "진행 중인 가게 이벤트 목록이 성공적으로 조회되었습니다.",
            HttpStatus.OK.value()),
    EVENT_DELETED("EVENT_DELETED", "이벤트가 성공적으로 삭제되었습니다.", HttpStatus.OK.value()),
    DISTANCE_CALCULATED("DISTANCE_CALCULATED", "소비자와 가게 간의 거리를 계산했습니다.", HttpStatus.OK.value()),

    // 경로
    PUBLIC_DIRECTIONS_FOUND("PUBLIC_DIRECTIONS_FOUND", "대중교통 경로를 성공적으로 조회했습니다.", HttpStatus.OK.value()),
    DISTANCE_TOO_SHORT("DISTANCE_TOO_SHORT", "해당 위치는 너무 가까워 대중교통 경로가 제공되지 않습니다.", HttpStatus.OK.value());

    private final String code;
    private final String message;
    private final int status;
}
