package com.global.redis.publisher;

import static com.global.redis.constants.RedisConstants.ERROR_REDIS_ARG_SERIALIZATION_FAILED;
import static com.global.redis.constants.RedisConstants.ERROR_REDIS_CONNECTION_FAILED;
import static com.global.redis.constants.RedisConstants.ERROR_REDIS_LUA_EXECUTION_FAILED;
import static com.global.redis.constants.RedisConstants.ERROR_REDIS_PROCESSING_FAILED;
import static com.global.redis.constants.RedisConstants.ERROR_REDIS_STREAM_KEY_SERIALIZATION_FAILED;
import static com.global.redis.constants.RedisConstants.ERROR_SERIALIZATION_FAILED;
import static com.global.redis.constants.RedisConstants.REDIS_PUBLISHER_CONNECTION_ERROR;
import static com.global.redis.constants.RedisConstants.REDIS_PUBLISHER_PUBLISHING_MESSAGE;
import static com.global.redis.constants.RedisConstants.REDIS_PUBLISHER_SERIALIZATION_ERROR;
import static com.global.redis.constants.RedisConstants.REDIS_PUBLISHER_SUCCESS_MESSAGE;
import static com.global.redis.constants.RedisConstants.REDIS_PUBLISHER_UNEXPECTED_ERROR;
import static com.global.redis.constants.RedisConstants.REDIS_XADD_SCRIPT;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.global.redis.constants.RedisStreamKey;
import com.global.redis.dto.RedisRetryableMessage;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.connection.ReturnType;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

// @formatter:off
/**
 /**
 * Redis Stream에 발행되는 메시지를 처리하는 추상 클래스.
 * RedisRetryableMessage를 통해 메시지 재시도 기능을 제공하고,
 * RedisStreamWriter 인터페이스로 메시지 발행 책임을 수행한다.
 *
 * @param <T> 발행할 메시지의 타입 (RedisRetryableMessage 구현체)
 */
// @formatter:on
@Slf4j
public abstract class RedisStreamPublisher<T extends RedisRetryableMessage> implements RedisStreamWriter<T> {

    private final RedisTemplate<String, Object> redisTemplate;    // Redis 작업을 위한 템플릿
    private final ObjectMapper objectMapper;                      // JSON 변환을 위한 매퍼

    /**
     * RedisStreamPublisher 생성자
     *
     * @param redisTemplate Redis 작업을 위한 템플릿
     * @param objectMapper  JSON 변환을 위한 매퍼
     */
    protected RedisStreamPublisher(final RedisTemplate<String, Object> redisTemplate,
                                   final ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void publish(RedisStreamKey key, T payload) {
        publishToStreamWithMaxLen(key, payload); // 기존 protected 메서드 호출
    }

    /**
     * Lua 스크립트를 이용해 메시지 수를 제한하여 Redis Stream에 메시지를 안정적으로 발행한다.
     *
     * @param streamKeyEnum 발행 대상 Stream 키(enum)
     * @param payload       전송할 메시지 객체
     */
    protected void publishToStreamWithMaxLen(final RedisStreamKey streamKeyEnum, final T payload) {
        String streamKey = streamKeyEnum.value();
        long maxLen = streamKeyEnum.maxLen();
        try {
            log.debug(REDIS_PUBLISHER_PUBLISHING_MESSAGE, streamKey, maxLen, payload);

            Map<String, Object> map = convertPayloadToMap(payload);
            List<Object> args = buildScriptArguments(maxLen, map);
            executeStreamInsertScript(streamKey, args);

            log.debug(REDIS_PUBLISHER_SUCCESS_MESSAGE, streamKey);
        } catch (IllegalArgumentException e) {
            log.warn(REDIS_PUBLISHER_SERIALIZATION_ERROR, streamKey, e.toString());
            throw new RuntimeException(ERROR_SERIALIZATION_FAILED, e);
        } catch (RedisConnectionFailureException e) {
            log.error(REDIS_PUBLISHER_CONNECTION_ERROR, streamKey, e);
            throw new RuntimeException(ERROR_REDIS_CONNECTION_FAILED, e);
        } catch (Exception e) {
            log.error(REDIS_PUBLISHER_UNEXPECTED_ERROR, streamKey, e.toString());
            throw new RuntimeException(ERROR_REDIS_PROCESSING_FAILED, e);
        }
    }

    /**
     * payload 객체를 Map<String, Object> 형태로 변환한다.
     *
     * @param payload 직렬화 대상 객체
     * @return key-value 쌍의 Map (Redis field-value 구조용)
     */
    private Map<String, Object> convertPayloadToMap(final T payload) {
        return objectMapper.convertValue(payload, new TypeReference<>() {});
    }

    /**
     * Lua XADD 스크립트용 인자 목록(maxLen, field-value)을 구성한다.
     * - Collection/Map은 JSON 문자열로 직렬화
     * - Instant/OffsetDateTime/ZonedDateTime은 ISO-8601 문자열
     * - 그 외는 String.valueOf
     *
     * @param maxLen     최대 메시지 수
     * @param payloadMap 메시지 필드 맵
     * @return Lua ARGV용 인자 리스트
     */
    private List<Object> buildScriptArguments(final long maxLen, final Map<String, Object> payloadMap) {
        List<Object> args = new ArrayList<>();
        args.add(String.valueOf(maxLen));

        for (Map.Entry<String, Object> entry : payloadMap.entrySet()) {
            args.add(entry.getKey());
            Object v = entry.getValue();

            try {
                if (v == null) {
                    args.add("null");
                } else if (v instanceof CharSequence) {
                    args.add(v.toString());
                } else if (v instanceof Collection || v instanceof Map) {
                    // 복합 타입은 반드시 JSON 문자열로
                    args.add(objectMapper.writeValueAsString(v));
                } else if (v instanceof Instant) {
                    args.add(((Instant) v).toString()); // ISO-8601 UTC
                } else if (v instanceof OffsetDateTime) {
                    args.add(((OffsetDateTime) v).toString()); // ISO-8601
                } else if (v instanceof ZonedDateTime) {
                    args.add(((ZonedDateTime) v).toString()); // ISO-8601
                } else {
                    // 숫자/불리언/기타 단순 타입
                    args.add(String.valueOf(v));
                }
            } catch (Exception ex) {
                // JSON 직렬화 실패 등은 명확히 올림
                throw new IllegalArgumentException("Failed to serialize field '" + entry.getKey() + "'", ex);
            }
        }
        return args;
    }

    /**
     * Redis에 Lua 스크립트를 실행하여 메시지를 추가 (MAXLEN 포함)
     *
     * @param streamKey Redis Stream 키
     * @param args      Lua 스크립트에 전달할 ARGV 리스트
     */
    private void executeStreamInsertScript(final String streamKey, final List<Object> args) {
        try {
            byte[][] keysAndArgs = prepareKeysAndArgs(streamKey, args);
            evalScript(keysAndArgs);
        } catch (Exception e) {
            throw new RuntimeException(String.format(ERROR_REDIS_LUA_EXECUTION_FAILED, streamKey), e);
        }
    }

    /**
     * streamKey와 인자 리스트를 직렬화하여 Lua KEYS + ARGV 배열을 구성한다.
     *
     * @param streamKey Redis Stream 키
     * @param args      field-value 쌍 포함 인자 리스트
     * @return 직렬화된 바이트 배열
     */
    private byte[][] prepareKeysAndArgs(final String streamKey, final List<Object> args) {
        RedisSerializer<String> serializer = new StringRedisSerializer();

        byte[] rawKey = serializer.serialize(streamKey);
        if (Objects.isNull(rawKey)) {
            throw new IllegalArgumentException(String.format(ERROR_REDIS_STREAM_KEY_SERIALIZATION_FAILED, streamKey));
        }

        byte[][] argBytes = serializeArgs(args, serializer);

        byte[][] keysAndArgs = new byte[1 + argBytes.length][];
        keysAndArgs[0] = rawKey;
        System.arraycopy(argBytes, 0, keysAndArgs, 1, argBytes.length);

        return keysAndArgs;
    }

    /**
     * field-value 등 Lua ARGV 인자를 직렬화한다.
     *
     * @param args       field-value 등 ARGV 값
     * @param serializer Redis 문자열 직렬화기
     * @return 직렬화된 byte 배열
     */
    private byte[][] serializeArgs(final List<Object> args, final RedisSerializer<String> serializer) {
        return args.stream()
                .map(arg -> {
                    byte[] encoded = serializer.serialize(arg.toString());
                    if (Objects.isNull(encoded)) {
                        throw new IllegalArgumentException(String.format(ERROR_REDIS_ARG_SERIALIZATION_FAILED, arg));
                    }
                    return encoded;
                })
                .toArray(byte[][]::new);
    }

    /**
     * Lua 스크립트를 Redis에 실행한다.
     *
     * @param keysAndArgs 직렬화된 KEYS[1] + ARGV[*]
     */
    private void evalScript(final byte[][] keysAndArgs) {
        redisTemplate.execute((RedisCallback<Object>) connection -> {
            connection.scriptingCommands().eval(
                    REDIS_XADD_SCRIPT.getBytes(StandardCharsets.UTF_8),
                    ReturnType.VALUE,
                    1,
                    keysAndArgs
            );
            return null;
        });
    }
}
