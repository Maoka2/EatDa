package com.global.redis.constants;

import static com.global.redis.constants.RedisConstants.DLQ_SUFFIX;
import static com.global.redis.constants.RedisConstants.STREAM_EVENT_ASSET;
import static com.global.redis.constants.RedisConstants.STREAM_EVENT_ASSET_MAX_LEN;
import static com.global.redis.constants.RedisConstants.STREAM_EVENT_ASSET_TTL;
import static com.global.redis.constants.RedisConstants.STREAM_MENU_POSTER;
import static com.global.redis.constants.RedisConstants.STREAM_MENU_POSTER_MAX_LEN;
import static com.global.redis.constants.RedisConstants.STREAM_MENU_POSTER_TTL;
import static com.global.redis.constants.RedisConstants.STREAM_OCR_MENU;
import static com.global.redis.constants.RedisConstants.STREAM_OCR_MENU_MAX_LEN;
import static com.global.redis.constants.RedisConstants.STREAM_OCR_REQUEST_TTL;
import static com.global.redis.constants.RedisConstants.STREAM_OCR_VERIFICATION;
import static com.global.redis.constants.RedisConstants.STREAM_OCR_VERIFICATION_MAX_LEN;
import static com.global.redis.constants.RedisConstants.STREAM_REVIEW_ASSET;
import static com.global.redis.constants.RedisConstants.STREAM_REVIEW_ASSET_MAX_LEN;
import static com.global.redis.constants.RedisConstants.STREAM_REVIEW_ASSET_TTL;
import static com.global.redis.constants.RedisConstants.STREAM_TEST_DLQ;
import static com.global.redis.constants.RedisConstants.STREAM_TEST_MAX_LEN;
import static com.global.redis.constants.RedisConstants.STREAM_TEST_RETRY;
import static com.global.redis.constants.RedisConstants.STREAM_TEST_TTL;

import java.time.Duration;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public enum RedisStreamKey {
    REVIEW_ASSET(STREAM_REVIEW_ASSET, STREAM_REVIEW_ASSET_TTL, STREAM_REVIEW_ASSET_MAX_LEN),
    MENU_POSTER(STREAM_MENU_POSTER, STREAM_MENU_POSTER_TTL, STREAM_MENU_POSTER_MAX_LEN),
    EVENT_ASSET(STREAM_EVENT_ASSET, STREAM_EVENT_ASSET_TTL, STREAM_EVENT_ASSET_MAX_LEN),
    OCR_VERIFICATION(STREAM_OCR_VERIFICATION, STREAM_OCR_REQUEST_TTL, STREAM_OCR_VERIFICATION_MAX_LEN),
    OCR_MENU(STREAM_OCR_MENU, STREAM_OCR_REQUEST_TTL, STREAM_OCR_MENU_MAX_LEN),

    // 테스트용
    TEST_RETRY(STREAM_TEST_RETRY, STREAM_TEST_TTL, STREAM_TEST_MAX_LEN),
    TEST_DLQ(STREAM_TEST_DLQ, STREAM_TEST_TTL, STREAM_TEST_MAX_LEN);


    private final String value;
    private final Duration ttl;
    private final long maxLen;

    public String value() {
        return value;
    }

    public Duration ttl() {
        return ttl;
    }

    public long maxLen() {
        return maxLen;
    }

    public String deadLetterQueueKey() {
        return this.value + DLQ_SUFFIX;
    }
}
