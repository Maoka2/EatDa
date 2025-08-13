package com.global.redis.publisher;

import com.global.redis.constants.RedisStreamKey;

/**
 * RedisStreamPublisher와 같은 퍼블리셔 구현체가 이 인터페이스를 통해 Redis Stream 메시지 발행 책임을 위임받는다.
 *
 * @param <T> 발행할 메시지 타입
 */
public interface RedisStreamWriter<T> {

    /**
     * 지정된 Redis Stream 키에 메시지를 발행한다.
     *
     * @param key     대상 Redis Stream 키 (스트림 이름 및 maxLen 포함)
     * @param payload 발행할 메시지 객체
     */
    void publish(RedisStreamKey key, T payload);
}
