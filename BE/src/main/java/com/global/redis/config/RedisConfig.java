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
    public RedisTemplate<String, Object> redisTemplate(final RedisConnectionFactory factory,
                                                       final ObjectMapper objectMapper) {
        return createRedisTemplate(factory, objectMapper);
    }

    /**
     * Redis 스트림 전용 템플릿 빈 생성
     */
    @Bean(name = "redisStreamTemplate")
    public RedisTemplate<String, Object> redisStreamTemplate(final RedisConnectionFactory factory,
                                                             final ObjectMapper objectMapper) {
        return createRedisTemplate(factory, objectMapper);
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

    /**
     * Redis 템플릿 생성을 위한 private 메서드 직렬화 설정 및 연결 설정을 수행
     */
    private RedisTemplate<String, Object> createRedisTemplate(final RedisConnectionFactory factory,
                                                              final ObjectMapper objectMapper) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);

        GenericJackson2JsonRedisSerializer serializer = createJsonSerializer(objectMapper);
        configureSerializers(template, serializer);

        template.afterPropertiesSet();
        return template;
    }

    /**
     * JSON 직렬화를 위한 GenericJackson2JsonRedisSerializer 생성
     */
    private GenericJackson2JsonRedisSerializer createJsonSerializer(final ObjectMapper objectMapper) {
        return new GenericJackson2JsonRedisSerializer(objectMapper);
    }

    /**
     * Redis 템플릿의 직렬화 설정 구성
     */
    private void configureSerializers(final RedisTemplate<String, Object> template,
                                      final GenericJackson2JsonRedisSerializer serializer) {
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(serializer);
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(serializer);
    }
}
