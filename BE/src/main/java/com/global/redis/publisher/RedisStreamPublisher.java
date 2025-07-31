package com.global.redis.publisher;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.springframework.data.redis.core.RedisTemplate;

/**
 * Redis Stream에 메시지를 발행하는 추상 클래스
 *
 * @param <T> 발행할 메시지의 타입
 */
public abstract class RedisStreamPublisher<T> {

    private final RedisTemplate<String, Object> redisTemplate;    // Redis 작업을 위한 템플릿
    private final ObjectMapper objectMapper;                      // JSON 변환을 위한 매퍼

    /**
     * RedisStreamPublisher 생성자
     *
     * @param redisTemplate Redis 작업을 위한 템플릿
     * @param objectMapper  JSON 변환을 위한 매퍼
     */
    protected RedisStreamPublisher(final RedisTemplate<String, Object> redisTemplate, final ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * 메시지를 Redis Stream에 발행
     *
     * @param streamKey 스트림 키
     * @param payload   발행할 메시지
     */
    protected void publishToStream(final String streamKey, final T payload) {
        try {
            Map<String, Object> map = objectMapper.convertValue(payload, new TypeReference<>() {
            });
            redisTemplate.opsForStream().add(streamKey, map);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Redis Stream 직렬화 실패", e);
        }
    }
}
