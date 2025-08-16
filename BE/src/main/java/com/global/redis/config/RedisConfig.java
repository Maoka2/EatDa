package com.global.redis.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis 설정을 관리하는 클래스
 */
@Configuration
public class RedisConfig {

    /**
     * Redis 기본 템플릿 빈 생성
     */
    @Bean(name = "redisTemplate")
    public RedisTemplate<String, Object> redisTemplate(
            RedisConnectionFactory factory, ObjectMapper objectMapper) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        var json = new GenericJackson2JsonRedisSerializer(objectMapper);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(json);
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(json);
        template.afterPropertiesSet();
        return template;
    }

    /**
     * Redis 스트림 전용 템플릿 빈 생성
     */
    @Bean(name = "redisStreamTemplate")
    public RedisTemplate<String, String> redisStreamTemplate(RedisConnectionFactory factory) {
        // 스트림은 문자열로 통일 (호환성↑)
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        var str = new StringRedisSerializer();
        template.setKeySerializer(str);
        template.setValueSerializer(str);
        template.setHashKeySerializer(str);
        template.setHashValueSerializer(str);
        template.afterPropertiesSet();
        return template;
    }

    /**
     * ObjectMapper 빈 생성 날짜/시간 처리를 위한 설정 포함
     */
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }
}
