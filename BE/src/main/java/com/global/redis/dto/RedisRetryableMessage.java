package com.global.redis.dto;

import com.global.redis.constants.RetryFailReason;
import java.time.Instant;

public interface RedisRetryableMessage {
    Instant getExpireAt();

    int getRetryCount();

    Instant getNextRetryAt();

    RetryFailReason getRetryFailReason();
}
