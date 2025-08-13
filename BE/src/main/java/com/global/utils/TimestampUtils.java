package com.global.utils;

import static com.global.constants.Messages.UTILITY_CLASS_ERROR;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

public final class TimestampUtils {
    private TimestampUtils() {
        throw new IllegalStateException(UTILITY_CLASS_ERROR.message());
    }

    /**
     * ISO-8601 형식의 현재 시간을 문자열로 반환합니다.
     */
    public static String now() {
        return Instant.now().truncatedTo(ChronoUnit.MILLIS).toString();
    }

    /**
     * 현재 시간을 밀리초 단위로 반환합니다.
     */
    public static long currentTimeMillis() {
        return Instant.now().toEpochMilli();
    }
}
