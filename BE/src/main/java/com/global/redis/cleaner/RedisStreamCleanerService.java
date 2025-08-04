package com.global.redis.cleaner;

import static com.global.redis.constants.RedisConstants.REDIS_STREAM_CLEANER_ERROR_MESSAGE;
import static com.global.redis.constants.RedisConstants.REDIS_STREAM_CLEANER_FINISH_MESSAGE;
import static com.global.redis.constants.RedisConstants.REDIS_STREAM_CLEANER_INFO_MESSAGE;
import static com.global.redis.constants.RedisConstants.REDIS_STREAM_CLEANER_MISSING_EXPIRE_MESSAGE;
import static com.global.redis.constants.RedisConstants.REDIS_STREAM_CLEANER_PARSE_ERROR_MESSAGE;
import static com.global.redis.constants.RedisConstants.REDIS_STREAM_CLEANER_START_MESSAGE;
import static com.global.redis.constants.RedisConstants.STREAM_FIELD_EXPIRE_AT;
import static com.global.redis.constants.RedisConstants.STREAM_MESSAGE_BATCH_SIZE;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.global.redis.constants.RedisStreamKey;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Range;
import org.springframework.data.redis.connection.Limit;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Redis Stream에 기록된 만료 메시지를 주기적으로 정리하는 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RedisStreamCleanerService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    /**
     * 모든 Redis Stream에 대해 만료된 메시지를 정리한다
     */
    public void cleanExpiredMessagesFromAllStreams() {
        log.info(REDIS_STREAM_CLEANER_START_MESSAGE);
        for (final RedisStreamKey stream : RedisStreamKey.values()) {
            try {
                int deleted = cleanExpiredMessages(stream);
                log.info(REDIS_STREAM_CLEANER_INFO_MESSAGE, stream.value(), deleted);
            } catch (Exception e) {
                log.error(REDIS_STREAM_CLEANER_ERROR_MESSAGE, stream.value(), e);
            }
        }
        log.info(REDIS_STREAM_CLEANER_FINISH_MESSAGE);
    }

    /**
     * 특정 Redis Stream에서 만료된 메시지를 정리
     *
     * @param streamKey 대상 Stream 키
     * @return 삭제된 메시지 수
     */
    private int cleanExpiredMessages(final RedisStreamKey streamKey) {
        List<MapRecord<String, Object, Object>> records = fetchStreamMessages(streamKey.value());
        return filterAndDeleteExpiredMessages(streamKey.value(), records);
    }

    /**
     * Redis Stream에서 메시지를 조회
     *
     * @param streamKey Stream 키
     * @return 조회된 메시지 리스트
     */
    private List<MapRecord<String, Object, Object>> fetchStreamMessages(final String streamKey) {
        return redisTemplate.opsForStream().range(
                streamKey,
                Range.unbounded(),
                Limit.limit().count(STREAM_MESSAGE_BATCH_SIZE)
        );
    }

    /**
     * Redis Stream에서 필터링된 만료 메시지를 삭제
     *
     * @param streamKey    Redis Stream 키
     * @param inputRecords 삭제할 메시지 레코드 목록
     * @return 삭제된 메시지 수
     */
    private int filterAndDeleteExpiredMessages(final String streamKey,
                                               final List<MapRecord<String, Object, Object>> inputRecords) {
        List<MapRecord<String, Object, Object>> records = Objects.requireNonNullElse(inputRecords, List.of());
        LocalDateTime now = LocalDateTime.now();
        int deletedCount = 0;

        for (final MapRecord<String, Object, Object> record : records) {
            LocalDateTime expireAt = extractExpireAt(record, streamKey);
            if (Objects.isNull(expireAt)) {
                continue;
            }

            if (expireAt.isBefore(now)) {
                redisTemplate.opsForStream().delete(streamKey, record.getId());
                deletedCount++;
            }
        }

        return deletedCount;
    }

    /**
     * 메시지에서 expireAt 값을 추출하고 LocalDateTime으로 변환합니다.
     *
     * @param record    Redis 메시지 레코드
     * @param streamKey 메시지가 속한 Stream 키
     * @return 변환된 LocalDateTime 값 또는 실패 시 null
     */
    private LocalDateTime extractExpireAt(final MapRecord<String, Object, Object> record, final String streamKey) {
        Object raw = record.getValue().get(STREAM_FIELD_EXPIRE_AT);
        if (Objects.isNull(raw)) {
            log.debug(REDIS_STREAM_CLEANER_MISSING_EXPIRE_MESSAGE, record.getId(), streamKey);
            return null;
        }

        try {
            return objectMapper.convertValue(raw, LocalDateTime.class);
        } catch (Exception e) {
            log.warn(REDIS_STREAM_CLEANER_PARSE_ERROR_MESSAGE, record.getId(), streamKey, e);
            return null;
        }
    }
}
