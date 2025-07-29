package com.global.utils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

public final class TimestampUtils {
    private TimestampUtils() {
        throw new IllegalStateException("Utility class");
    }

    public static String now() {
        return Instant.now().truncatedTo(ChronoUnit.MILLIS).toString();
    }
}
