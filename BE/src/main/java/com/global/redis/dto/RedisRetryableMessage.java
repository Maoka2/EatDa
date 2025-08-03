package com.global.redis.dto;

import java.time.LocalDateTime;

public interface RedisRetryableMessage {
    LocalDateTime getExpireAt();

    int getRetryCount();

    LocalDateTime getNextRetryAt();
}
