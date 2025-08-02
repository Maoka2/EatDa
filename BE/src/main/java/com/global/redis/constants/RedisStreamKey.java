package com.global.redis.constants;

import static com.global.redis.constants.RedisConstants.DLQ_SUFFIX;
import static com.global.redis.constants.RedisConstants.STREAM_EVENT_ASSET_TTL;
import static com.global.redis.constants.RedisConstants.STREAM_MENU_POSTER_TTL;
import static com.global.redis.constants.RedisConstants.STREAM_OCR_REQUEST_TTL;
import static com.global.redis.constants.RedisConstants.STREAM_REVIEW_ASSET_TTL;

import java.time.Duration;

public enum RedisStreamKey {
    REVIEW_ASSET("review.asset.generate", STREAM_REVIEW_ASSET_TTL),
    MENU_POSTER("menu.poster.generate", STREAM_MENU_POSTER_TTL),
    EVENT_ASSET("event.asset.generate", STREAM_EVENT_ASSET_TTL),
    OCR_VERIFICATION("ocr.verification.request", STREAM_OCR_REQUEST_TTL),
    OCR_MENU("ocr.menu.request", STREAM_OCR_REQUEST_TTL);

    private final String value;
    private final Duration ttl;

    RedisStreamKey(String value, Duration ttl) {
        this.value = value;
        this.ttl = ttl;
    }

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
