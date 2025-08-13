package com.domain.event.infrastructure.redis;

import com.domain.event.dto.redis.EventAssetGenerateMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.global.redis.publisher.RedisStreamPublisher;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class EventAssetRedisPublisher extends RedisStreamPublisher<EventAssetGenerateMessage> {
    public EventAssetRedisPublisher(RedisTemplate<String, Object> redisTemplate,
                                    ObjectMapper objectMapper) {
        super(redisTemplate, objectMapper);
    }
}
