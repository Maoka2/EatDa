package com.global.redis.constants;


import static com.global.constants.Messages.UTILITY_CLASS_ERROR;

import java.time.Duration;

public final class RedisConstants {
    // ===== 스트림 필드 =====
    public static final String STREAM_FIELD_EXPIRE_AT = "expireAt";        // 스트림 메시지 만료 시간 필드
    public static final int STREAM_MESSAGE_BATCH_SIZE = 1_000;              // 스트림 메시지 최대 조회 건수

    // ===== DLQ (Dead Letter Queue) 관련 =====
    public static final String DLQ_SUFFIX = ".dead";

    // ===== 스트림 메시지 TTL 설정 =====
    public static final Duration STREAM_DEFAULT_TTL = Duration.ofMinutes(60);             // 기본 스트림 TTL
    public static final Duration STREAM_OCR_REQUEST_TTL = Duration.ofMinutes(3);          // OCR 요청 메시지 TTL
    public static final Duration STREAM_REVIEW_ASSET_TTL = Duration.ofMinutes(5);         // 리뷰 에셋 생성 요청 TTL
    public static final Duration STREAM_MENU_POSTER_TTL = Duration.ofMinutes(3);          // 메뉴 포스터 생성 요청 TTL
    public static final Duration STREAM_EVENT_ASSET_TTL = Duration.ofMinutes(3);          // 이벤트 에셋 생성 요청 TTL
    public static final Duration STREAM_TEST_TTL = Duration.ZERO;                         // 테스트용 TTL (즉시 만료)

    // ===== Redis Stream Key =====
    public static final String STREAM_REVIEW_ASSET = "review.asset.generate";       // 리뷰 에셋 생성 요청
    public static final String STREAM_MENU_POSTER = "menu.poster.generate";         // 메뉴 포스터 생성 요청
    public static final String STREAM_EVENT_ASSET = "event.asset.generate";         // 이벤트 에셋 생성 요청
    public static final String STREAM_OCR_VERIFICATION = "ocr.verification.request"; // OCR 검증 요청
    public static final String STREAM_OCR_MENU = "ocr.menu.request";               // OCR 메뉴 요청

    // ===== 테스트 전용 Redis Stream Key (운영 사용 금지) =====
    public static final String STREAM_TEST_RETRY = "test.retry";                   // 테스트용 재시도 스트림
    public static final String STREAM_TEST_DLQ = "test.dlq";                       // 테스트용 DLQ 스트림

    // ===== Retry 관련 =====
    public static final int MAX_RETRY_COUNT = 3;

    // ===== 캐시 TTL 설정 =====
    public static final Duration CACHE_DEFAULT_TTL = Duration.ofMinutes(60);       // 일반 기본 캐시
    public static final Duration CACHE_POI_STORE_DISTANCE_TTL = Duration.ofDays(1);      // POI 별 가게 목록
    public static final Duration CACHE_REVIEW_FEED_TTL = Duration.ofMinutes(30);   // 리뷰 피드 캐시
    public static final Duration CACHE_EVENT_FEED_TTL = Duration.ofMinutes(30);    // 이벤트 피드 캐시
    public static final Duration CACHE_STORE_DETAIL_TTL = Duration.ofHours(1);     // 가게 상세 정보  
    public static final Duration CACHE_JWT_TOKEN_TTL = Duration.ofMinutes(15);     // 로그인 토큰

    // ===== Batch Job 관련 =====
    public static final String REDIS_STREAM_CLEANER_JOB_NAME = "redisStreamCleanerJob";
    public static final String REDIS_STREAM_CLEANER_STEP_NAME = "redisStreamCleanerStep";
    public static final String REDIS_STREAM_CLEANER_JOB_PARAM_TIMESTAMP = "timestamp";    // Job 실행 시간 파라미터
    public static final String REDIS_STREAM_CLEANER_EXECUTION_ERROR =
            "[RedisCleanerScheduler] 배치 실행 실패";                                      // 배치 실행 실패 에러 메시지

    // ===== 스트림 메시지 MAXLEN 설정 =====
    public static final long STREAM_REVIEW_ASSET_MAX_LEN = 2_000;      // 리뷰 에셋 생성 요청 최대 메시지 수
    public static final long STREAM_MENU_POSTER_MAX_LEN = 1_000;       // 메뉴 포스터 생성 요청 최대 메시지 수
    public static final long STREAM_EVENT_ASSET_MAX_LEN = 1_000;       // 이벤트 에셋 생성 요청 최대 메시지 수
    public static final long STREAM_OCR_VERIFICATION_MAX_LEN = 500;   // OCR 검증 요청 최대 메시지 수
    public static final long STREAM_OCR_MENU_MAX_LEN = 1_000;          // OCR 메뉴 요청 최대 메시지 수
    public static final long STREAM_TEST_MAX_LEN = 10;               // 테스트용 MAXLEN

    // ===== Redis Stream Cleaner 로그 메시지 =====
    public static final String REDIS_STREAM_CLEANER_START_MESSAGE =
            "[RedisCleaner] Started stream TTL cleanup";              // 스트림 정리 시작 메시지
    public static final String REDIS_STREAM_CLEANER_INFO_MESSAGE =
            "[RedisCleaner] Stream: {}, Deleted messages: {}";        // 스트림 정리 정보 메시지
    public static final String REDIS_STREAM_CLEANER_ERROR_MESSAGE =
            "[RedisCleaner] Failed to clean stream: {}";             // 스트림 정리 실패 메시지
    public static final String REDIS_STREAM_CLEANER_FINISH_MESSAGE =
            "[RedisCleaner] Finished all stream cleanup";            // 스트림 정리 완료 메시지
    public static final String REDIS_STREAM_CLEANER_MISSING_EXPIRE_MESSAGE =
            "[RedisCleaner] expireAt 필드 없음 - messageId: {} (stream: {})";    // expireAt 필드 누락 메시지
    public static final String REDIS_STREAM_CLEANER_PARSE_ERROR_MESSAGE =
            "[RedisCleaner] expireAt 파싱 실패 - messageId: {} (stream: {})";    // expireAt 파싱 실패 메시지

    // ===== Redis Stream Retry Handler 관련 상수 =====
    public static final String RETRY_MAX_COUNT_EXCEEDED_MESSAGE =
            "[RedisRetryHandler] Max retry count exceeded. Sending to DLQ: {}";             // 최대 재시도 횟수 초과 메시지
    public static final String ERROR_RETRY_STREAM_KEY_NOT_IMPLEMENTED =
            "[RedisRetryHandler] Retry StreamKey는 구현체에서 지정해야 합니다.";                // Retry StreamKey 미구현 에러
    public static final String ERROR_DLQ_STREAM_KEY_NOT_IMPLEMENTED =
            "[RedisRetryHandler] DLQ StreamKey는 구현체에서 지정해야 합니다.";                 // DLQ StreamKey 미구현 에러
    public static final String ERROR_UPDATE_RETRY_FIELDS_NOT_IMPLEMENTED =
            "[RedisRetryHandler] 메시지 필드 업데이트 로직은 구현체에서 정의해야 합니다.";        // 재시도 필드 업데이트 미구현 에러

    // ===== Redis Stream Publisher 관련 상수 =====
    public static final String REDIS_XADD_SCRIPT = """
                return redis.call('XADD', KEYS[1], 'MAXLEN', '~', ARGV[1], '*', unpack(ARGV, 2))
            """;

    public static final String ERROR_SERIALIZATION_FAILED = "Redis Stream 직렬화 실패";
    public static final String ERROR_REDIS_CONNECTION_FAILED = "Redis 연결 실패";
    public static final String ERROR_REDIS_PROCESSING_FAILED = "Redis Stream 처리 중 오류 발생";
    public static final String ERROR_REDIS_LUA_EXECUTION_FAILED = "Redis Lua Script 실행 실패 (streamKey=%s)";
    public static final String ERROR_REDIS_STREAM_KEY_SERIALIZATION_FAILED = "Stream key 직렬화 실패: %s";
    public static final String ERROR_REDIS_ARG_SERIALIZATION_FAILED = "ARG 직렬화 실패: %s";

    // ===== Redis Stream Publisher 로그 메시지 =====
    public static final String REDIS_PUBLISHER_PUBLISHING_MESSAGE =
            "[RedisPublisher] Publishing to stream: {}, maxLen={}, payload={}";    // 스트림 발행 시작 메시지
    public static final String REDIS_PUBLISHER_SUCCESS_MESSAGE =
            "[RedisPublisher] Successfully published to stream: {}";               // 스트림 발행 성공 메시지
    public static final String REDIS_PUBLISHER_SERIALIZATION_ERROR =
            "[RedisPublisher] Payload serialization failed for stream: {}, error: {}";  // 직렬화 실패 메시지
    public static final String REDIS_PUBLISHER_CONNECTION_ERROR =
            "[RedisPublisher] Redis connection failed for stream: {}";            // Redis 연결 실패 메시지
    public static final String REDIS_PUBLISHER_UNEXPECTED_ERROR =
            "[RedisPublisher] Unexpected error publishing to stream: {}, error: {}";  // 예상치 못한 오류 메시지

    private RedisConstants() {
        throw new UnsupportedOperationException(UTILITY_CLASS_ERROR.message());
    }
}
