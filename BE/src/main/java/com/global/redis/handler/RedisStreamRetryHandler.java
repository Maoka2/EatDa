package com.global.redis.handler;

import static com.global.redis.constants.RedisConstants.ERROR_DLQ_STREAM_KEY_NOT_IMPLEMENTED;
import static com.global.redis.constants.RedisConstants.ERROR_RETRY_STREAM_KEY_NOT_IMPLEMENTED;
import static com.global.redis.constants.RedisConstants.ERROR_UPDATE_RETRY_FIELDS_NOT_IMPLEMENTED;
import static com.global.redis.constants.RedisConstants.MAX_RETRY_COUNT;
import static com.global.redis.constants.RedisConstants.RETRY_MAX_COUNT_EXCEEDED_MESSAGE;

import com.global.redis.constants.RedisStreamKey;
import com.global.redis.dto.RedisRetryableMessage;
import com.global.redis.publisher.RedisStreamWriter;
import java.time.Duration;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Redis Stream 기반 메시지 처리 재시도 핸들러
 *
 * @param <T> 재시도 대상 메시지 타입 (RedisRetryableMessage 구현체)
 */
@Slf4j
@RequiredArgsConstructor
public class RedisStreamRetryHandler<T extends RedisRetryableMessage> {

    private final RedisStreamWriter<T> retryPublisher;  // 재시도 메시지를 다시 Redis로 발행하는 퍼블리셔
    private final RedisStreamWriter<T> dlqPublisher;    // 재시도 실패 시 DLQ로 발행하는 퍼블리셔
    private final Duration baseDelay;                   // 재시도 기본 지연 시간
    private final Duration maxDelay;                    // 재시도 최대 지연 시간

    // @formatter:off
    /**
     * 재시도 처리 진입점
     *
     * 재시도 가능 여부를 판단하여,
     * - 가능하면 다음 재시도 시각 계산 후 retryPublisher 발행
     * - 초과 시 DLQ로 전송
     */
    // @formatter:on
    public void handleRetry(final T message) {
        int retryCount = message.getRetryCount();

        if (retryCount >= MAX_RETRY_COUNT) {
            sendToDlq(message);
            return;
        }

        retryMessage(message, retryCount);
    }

    /**
     * DLQ 전송 처리
     * <p>
     * 재시도 한도를 초과한 메시지를 Dead Letter Queue로 이동시킨다.
     */
    protected void sendToDlq(final T message) {
        log.warn(RETRY_MAX_COUNT_EXCEEDED_MESSAGE, message);
        dlqPublisher.publish(getDLQStreamKey(), message);
    }

    /**
     * 재시도 메시지 발행 처리
     * <p>
     * 지수 백오프 기반 nextRetryAt 계산 후, retryCount 증가 및 업데이트된 메시지를 발행한다.
     */
    protected void retryMessage(final T original, final int currentRetryCount) {
        LocalDateTime nextRetryAt = calculateNextRetryTime(currentRetryCount);
        T updatedMessage = updateRetryFields(original, currentRetryCount + 1, nextRetryAt);
        retryPublisher.publish(getRetryStreamKey(), updatedMessage);
    }

    /**
     * 지수 백오프 기반 재시도 시각 계산
     *
     * @param retryCount 현재 재시도 횟수
     * @return 다음 재시도 시각 (now + backoff delay)
     */
    private LocalDateTime calculateNextRetryTime(final int retryCount) {
        long backoff = Math.min(
                baseDelay.toMillis() * (1L << retryCount),  // 2^retryCount 지수 백오프
                maxDelay.toMillis()
        );
        return LocalDateTime.now().plus(Duration.ofMillis(backoff));
    }

    /**
     * 재시도 스트림 키 반환 구현체에서 도메인별 스트림 키를 지정해야 함
     */
    protected RedisStreamKey getRetryStreamKey() {
        throw new UnsupportedOperationException(ERROR_RETRY_STREAM_KEY_NOT_IMPLEMENTED);
    }

    /**
     * DLQ 스트림 키 반환 구현체에서 도메인별 DLQ 스트림 키를 지정해야 함
     */
    protected RedisStreamKey getDLQStreamKey() {
        throw new UnsupportedOperationException(ERROR_DLQ_STREAM_KEY_NOT_IMPLEMENTED);
    }

    /**
     * 재시도 카운트 및 다음 재시도 시각 필드가 반영된 메시지 생성 불변 메시지를 사용하는 경우 새 객체 생성 필요
     */
    protected T updateRetryFields(final T original, final int retryCount, final LocalDateTime nextRetryAt) {
        throw new UnsupportedOperationException(ERROR_UPDATE_RETRY_FIELDS_NOT_IMPLEMENTED);
    }
}
