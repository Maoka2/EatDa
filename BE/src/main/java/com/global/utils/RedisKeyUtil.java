package com.global.utils;

import static com.global.constants.redis.RedisConstants.DLQ_SUFFIX;
import static com.global.constants.redis.RedisStreamKey.EVENT_ASSET;
import static com.global.constants.redis.RedisStreamKey.MENU_POSTER;
import static com.global.constants.redis.RedisStreamKey.OCR_MENU;
import static com.global.constants.redis.RedisStreamKey.OCR_VERIFICATION;
import static com.global.constants.redis.RedisStreamKey.REVIEW_ASSET;

public class RedisKeyUtil {
    private static final String STORE_DISTANCE_KEY_FORMAT = "POI:%d:store:%dm";

    // ===== 캐시 키 =====
    public static String storeDistanceKey(final Long poiId, final int distanceBand) {
        return String.format(STORE_DISTANCE_KEY_FORMAT, poiId, distanceBand);
    }

    // ===== Redis Stream Keys =====
    public static String reviewAssetStream() {
        return REVIEW_ASSET.value();
    }

    public static String menuPosterStream() {
        return MENU_POSTER.value();
    }

    public static String eventAssetStream() {
        return EVENT_ASSET.value();
    }

    public static String ocrVerificationStream() {
        return OCR_VERIFICATION.value();
    }

    public static String ocrMenuStream() {
        return OCR_MENU.value();
    }

    // ===== DLQ =====
    public static String deadLetterQueue(final String baseStreamKey) {
        return baseStreamKey + DLQ_SUFFIX;
    }
}
