package com.domain.review.publisher;

import com.domain.review.dto.redis.ReviewAssetGenerateMessage;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.global.redis.publisher.RedisStreamPublisher;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component("reviewAssetRedisStreamWriter")
public class ReviewAssetRedisStreamPublisher
        extends RedisStreamPublisher<ReviewAssetGenerateMessage> {

    public ReviewAssetRedisStreamPublisher(final RedisTemplate<String, Object> redisTemplate,
                                           final ObjectMapper objectMapper) {
        super(redisTemplate, objectMapper);
    }
}
