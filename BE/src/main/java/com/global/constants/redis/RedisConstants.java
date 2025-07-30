package com.global.constants.redis;

import static com.global.constants.Messages.UTILITY_CLASS_ERROR;

import java.time.Duration;

public final class RedisConstants {

    // ===== DLQ (Dead Letter Queue) 관련 =====
    public static final String DLQ_SUFFIX = ".dead";

    // ===== 스트림 메시지 TTL 설정 =====
    public static final Duration STREAM_DEFAULT_TTL = Duration.ofMinutes(60);             // 기본 스트림 TTL
    public static final Duration STREAM_POI_STORE_DISTANCE_TTL = Duration.ofDays(1);      // POI별 가게 거리 TTL 
    public static final Duration STREAM_OCR_REQUEST_TTL = Duration.ofMinutes(3);          // OCR 요청 메시지 TTL
    public static final Duration STREAM_REVIEW_ASSET_TTL = Duration.ofMinutes(5);         // 리뷰 에셋 생성 요청 TTL
    public static final Duration STREAM_MENU_POSTER_TTL = Duration.ofMinutes(3);          // 메뉴 포스터 생성 요청 TTL
    public static final Duration STREAM_EVENT_ASSET_TTL = Duration.ofMinutes(3);          // 이벤트 에셋 생성 요청 TTL

    // ===== Consumer Group 이름 =====
    public static final String REVIEW_ASSET_CONSUMER_GROUP = "review_asset_group";
    public static final String MENU_POSTER_CONSUMER_GROUP = "menu_poster_group";
    public static final String EVENT_ASSET_CONSUMER_GROUP = "event_asset_group";
    public static final String OCR_VERIFICATION_CONSUMER_GROUP = "ocr_verification_group";
    public static final String OCR_MENU_CONSUMER_GROUP = "ocr_menu_group";

    // ===== Retry 관련 =====
    public static final int MAX_RETRY_COUNT = 3;

    // ===== 캐시 TTL 설정 =====
    public static final Duration CACHE_DEFAULT_TTL = Duration.ofMinutes(60);       // 일반 기본 캐시
    public static final Duration CACHE_POI_STORE_DISTANCE_TTL = Duration.ofDays(1);      // POI 별 가게 목록
    public static final Duration CACHE_REVIEW_FEED_TTL = Duration.ofMinutes(30);   // 리뷰 피드 캐시
    public static final Duration CACHE_EVENT_FEED_TTL = Duration.ofMinutes(30);    // 이벤트 피드 캐시
    public static final Duration CACHE_STORE_DETAIL_TTL = Duration.ofHours(1);     // 가게 상세 정보  
    public static final Duration CACHE_JWT_TOKEN_TTL = Duration.ofMinutes(15);     // 로그인 토큰

    private RedisConstants() {
        throw new UnsupportedOperationException(UTILITY_CLASS_ERROR.message());
    }
}
