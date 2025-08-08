package com.global.redis.publisher;

import static com.global.redis.constants.RedisStreamKey.MENU_POSTER;
import static com.global.redis.constants.RedisStreamKey.REVIEW_ASSET;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.global.redis.constants.RedisStreamKey;
import com.global.redis.constants.RetryFailReason;
import com.global.redis.dto.RedisRetryableMessage;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.function.Consumer;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisScriptingCommands;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;

@ExtendWith(MockitoExtension.class)
class RedisStreamPublisherTest {

    @Mock
    RedisTemplate<String, Object> redisTemplate;

    @Mock
    ObjectMapper objectMapper;

    DummyPublisher publisher;

    static Stream<Arguments> exceptionScenarios() {
        return Stream.of(
                Arguments.of("payload 직렬화 실패", (Consumer<RedisStreamPublisherTest>) test -> {
                    when(test.objectMapper.convertValue(any(), any(TypeReference.class)))
                            .thenThrow(new IllegalArgumentException("fail"));
                }, RuntimeException.class),

                Arguments.of("Redis 연결 실패", (Consumer<RedisStreamPublisherTest>) test -> {
                    when(test.objectMapper.convertValue(any(), any(TypeReference.class)))
                            .thenReturn(Map.of("name", "value"));
                    when(test.redisTemplate.execute(any(RedisCallback.class)))
                            .thenThrow(new RedisConnectionFailureException("fail"));
                }, RuntimeException.class),

                Arguments.of("Lua 스크립트 실행 실패", (Consumer<RedisStreamPublisherTest>) test -> {
                    when(test.objectMapper.convertValue(any(), any(TypeReference.class)))
                            .thenReturn(Map.of("name", "value"));
                    when(test.redisTemplate.execute(any(RedisCallback.class)))
                            .thenThrow(new RuntimeException("Lua script failed"));
                }, RuntimeException.class)
        );
    }

    @BeforeEach
    void setUp() {
        publisher = new DummyPublisher(redisTemplate, objectMapper);
    }

    @Test
    void 직렬화_실패시_RuntimeException_발생한다() {
        DummyPayload payload = new DummyPayload("bad", 0);

        when(objectMapper.convertValue(any(), any(TypeReference.class)))
                .thenThrow(new IllegalArgumentException("fail"));

        assertThrows(RuntimeException.class,
                () -> publisher.publishToStreamWithMaxLen(REVIEW_ASSET, payload));
    }

    @Test
    void Redis_스크립트가_정상_호출된다() {
        // execute(RedisCallback<T>) 가 정상적으로 호출되는지 확인
        DummyPayload payload = new DummyPayload("name", 42);

        when(objectMapper.convertValue(any(), any(TypeReference.class)))
                .thenAnswer(invocation -> Map.of("name", "name", "value", 42));
        when(redisTemplate.execute(any(RedisCallback.class))).thenAnswer(invocation -> {
            RedisCallback<?> callback = invocation.getArgument(0);
            RedisConnection connection = mock(RedisConnection.class);
            RedisScriptingCommands scriptingCommands = mock(RedisScriptingCommands.class);

            when(connection.scriptingCommands()).thenReturn(scriptingCommands);
            lenient().when(scriptingCommands.eval(any(), any(), anyInt(), any())).thenReturn("OK");

            return callback.doInRedis(connection);
        });

        publisher.publishToStreamWithMaxLen(MENU_POSTER, payload);
    }

    @ParameterizedTest(name = "{index}: {0}")
    @MethodSource("exceptionScenarios")
    void publishToStreamWithMaxLen_예외_상황_테스트(String name,
                                             Consumer<RedisStreamPublisherTest> setup,
                                             Class<? extends Exception> expectedException) {
        setup.accept(this);  // 테스트 인스턴스 전달
        DummyPayload payload = new DummyPayload("name", 42);
        RedisStreamKey key = mock(RedisStreamKey.class);
        when(key.value()).thenReturn("stream.key");
        when(key.maxLen()).thenReturn(1000L);

        assertThrows(expectedException, () -> publisher.publishToStreamWithMaxLen(key, payload));
    }

    @Test
    void payload_field_직렬화_실패시_RuntimeException_발생한다() {
        // ObjectMapper는 성공하도록 둔다
        DummyPayload payload = new DummyPayload("name", 42);

        when(objectMapper.convertValue(any(), any(TypeReference.class)))
                .thenReturn(Map.of("name", new Object() {
                    @Override
                    public String toString() {
                        return "\uDC00"; // 직렬화 실패 유도
                    }
                }));

        RedisStreamKey validKey = mock(RedisStreamKey.class);

        assertThrows(RuntimeException.class,
                () -> publisher.publishToStreamWithMaxLen(validKey, payload));
    }

    record DummyPayload(String name, int value) implements RedisRetryableMessage {
        @Override
        public LocalDateTime getExpireAt() {
            return LocalDateTime.now().plusMinutes(5);
        }

        @Override
        public int getRetryCount() {
            return 0;
        }

        @Override
        public LocalDateTime getNextRetryAt() {
            return LocalDateTime.now();
        }

        @Override
        public RetryFailReason getRetryFailReason() {
            return RetryFailReason.TIMEOUT;
        }
    }

    static class DummyPublisher extends RedisStreamPublisher<DummyPayload> {
        DummyPublisher(RedisTemplate<String, Object> redisTemplate, ObjectMapper objectMapper) {
            super(redisTemplate, objectMapper);
        }
    }
}
