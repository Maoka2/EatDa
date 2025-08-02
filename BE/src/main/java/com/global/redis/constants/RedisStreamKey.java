package com.global.redis.constants;

import static com.global.redis.constants.RedisConstants.DLQ_SUFFIX;
import static com.global.redis.constants.RedisConstants.STREAM_EVENT_ASSET;
import static com.global.redis.constants.RedisConstants.STREAM_EVENT_ASSET_TTL;
import static com.global.redis.constants.RedisConstants.STREAM_MENU_POSTER;
import static com.global.redis.constants.RedisConstants.STREAM_MENU_POSTER_TTL;
import static com.global.redis.constants.RedisConstants.STREAM_OCR_MENU;
import static com.global.redis.constants.RedisConstants.STREAM_OCR_REQUEST_TTL;
import static com.global.redis.constants.RedisConstants.STREAM_OCR_VERIFICATION;
import static com.global.redis.constants.RedisConstants.STREAM_REVIEW_ASSET;
import static com.global.redis.constants.RedisConstants.STREAM_REVIEW_ASSET_TTL;

import java.time.Duration;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public enum RedisStreamKey {
    REVIEW_ASSET(STREAM_REVIEW_ASSET, STREAM_REVIEW_ASSET_TTL),
    MENU_POSTER(STREAM_MENU_POSTER, STREAM_MENU_POSTER_TTL),
    EVENT_ASSET(STREAM_EVENT_ASSET, STREAM_EVENT_ASSET_TTL),
    OCR_VERIFICATION(STREAM_OCR_VERIFICATION, STREAM_OCR_REQUEST_TTL),
    OCR_MENU(STREAM_OCR_MENU, STREAM_OCR_REQUEST_TTL);

    private final String value;
    private final Duration ttl;

    public String value() {
        return value;
    }

    public Duration ttl() {
        return ttl;
    }

    public String deadLetterQueueKey() {
        return this.value + DLQ_SUFFIX;
    }
}
