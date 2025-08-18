package com.global.redis.cleaner;

import static com.global.redis.constants.RedisConstants.REDIS_STREAM_CLEANER_ERROR_MESSAGE;
import static com.global.redis.constants.RedisConstants.REDIS_STREAM_CLEANER_FINISH_MESSAGE;
import static com.global.redis.constants.RedisConstants.REDIS_STREAM_CLEANER_INFO_MESSAGE;
import static com.global.redis.constants.RedisConstants.REDIS_STREAM_CLEANER_MISSING_EXPIRE_MESSAGE;
import static com.global.redis.constants.RedisConstants.REDIS_STREAM_CLEANER_PARSE_ERROR_MESSAGE;
import static com.global.redis.constants.RedisConstants.REDIS_STREAM_CLEANER_START_MESSAGE;
import static com.global.redis.constants.RedisConstants.STREAM_FIELD_EXPIRE_AT;
import static com.global.redis.constants.RedisConstants.STREAM_MESSAGE_BATCH_SIZE;

import com.global.redis.constants.RedisStreamKey;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
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
public class RedisStreamCleanerService {

    private final RedisTemplate<String, String> redisTemplate;

    public RedisStreamCleanerService(
            @Qualifier("redisStreamTemplate") RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

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

    private int cleanExpiredMessages(final RedisStreamKey streamKey) {
        List<MapRecord<String, Object, Object>> records = fetchStreamMessages(streamKey.value());
        return filterAndDeleteExpiredMessages(streamKey.value(), records);
    }

    private List<MapRecord<String, Object, Object>> fetchStreamMessages(final String streamKey) {
        return redisTemplate.opsForStream().range(
                streamKey, Range.unbounded(), Limit.limit().count(STREAM_MESSAGE_BATCH_SIZE)
        );
    }

    private int filterAndDeleteExpiredMessages(
            final String streamKey,
            final List<MapRecord<String, Object, Object>> inputRecords) {

        List<MapRecord<String, Object, Object>> records =
                Objects.requireNonNullElse(inputRecords, List.of());
        int deletedCount = 0;

        for (final MapRecord<String, Object, Object> record : records) {
            Instant expireAt = extractExpireAt(record, streamKey);
            if (expireAt != null && expireAt.isBefore(Instant.now())) {
                redisTemplate.opsForStream().delete(streamKey, record.getId());
                deletedCount++;
            }
        }
        return deletedCount;
    }

    private Instant extractExpireAt(
            final MapRecord<String, Object, Object> record,
            final String streamKey) {

        Object raw = record.getValue().get(STREAM_FIELD_EXPIRE_AT);
        if (raw == null) {
            log.debug(REDIS_STREAM_CLEANER_MISSING_EXPIRE_MESSAGE, record.getId(), streamKey);
            return null;
        }

        try {
            String s = raw.toString(); // StringRedisSerializer 덕분에 실제로는 String
            try {
                return Instant.parse(s); // ISO-8601
            } catch (DateTimeParseException ignored) {
                LocalDateTime ldt = LocalDateTime.parse(s);
                return ldt.atZone(ZoneId.systemDefault()).toInstant();
            }
        } catch (Exception e) {
            log.warn(REDIS_STREAM_CLEANER_PARSE_ERROR_MESSAGE, record.getId(), streamKey, e);
            return null;
        }
    }
}
