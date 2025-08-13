package com.domain.menu.redis;

import com.domain.menu.dto.redis.MenuPosterAssetGenerateMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.global.redis.publisher.RedisStreamPublisher;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class MenuPosterAssetRedisPublisher extends RedisStreamPublisher<MenuPosterAssetGenerateMessage> {
    public MenuPosterAssetRedisPublisher(RedisTemplate<String, Object> redisTemplate,
                                         ObjectMapper objectMapper) {
        super(redisTemplate, objectMapper);
    }
}
