package com.global.dto.response;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

public interface BaseResponse {
    static String now() {
        return Instant.now().truncatedTo(ChronoUnit.MILLIS).toString();
    }

    @NotNull
    String code();

    @NotNull
    String message();

    @NotNull
    int status();

    @NotNull
    String timestamp();
}
