package com.global.redis.dto;

import com.global.redis.constants.RetryFailReason;
import java.time.LocalDateTime;

public interface RedisRetryableMessage {
    LocalDateTime getExpireAt();

    int getRetryCount();

    LocalDateTime getNextRetryAt();

    RetryFailReason getRetryFailReason();
}
