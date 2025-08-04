package com.global.redis.handler;

import static com.global.redis.constants.RetryFailReason.TIMEOUT;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.global.redis.constants.RedisStreamKey;
import com.global.redis.constants.RetryFailReason;
import com.global.redis.dto.RedisRetryableMessage;
import com.global.redis.publisher.RedisStreamWriter;
import java.time.Duration;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class RedisStreamRetryHandlerTest {

    RedisStreamWriter<DummyMessage> retryPublisher;
    RedisStreamWriter<DummyMessage> dlqPublisher;
    DummyRetryHandler handler;

    @BeforeEach
    void setUp() {
        retryPublisher = mock(RedisStreamWriter.class);
        dlqPublisher = mock(RedisStreamWriter.class);
        handler = new DummyRetryHandler(retryPublisher, dlqPublisher,
                Duration.ofSeconds(1), Duration.ofSeconds(10));
    }

    @Test
    void 재시도_조건을_만족하면_retryPublisher가_호출된다() {
        DummyMessage originalMessage = new DummyMessage(2, LocalDateTime.now(), TIMEOUT);

        handler.handleRetry(originalMessage);

        verify(retryPublisher, times(1)).publish(eq(RedisStreamKey.TEST_RETRY), any(DummyMessage.class));
        verify(dlqPublisher, never()).publish(any(), any());
    }

    @Test
    void 재시도_한도를_초과하면_dlqPublisher가_호출된다() {
        DummyMessage message = new DummyMessage(3, LocalDateTime.now(), TIMEOUT);
        handler.handleRetry(message);
        verify(dlqPublisher, times(1)).publish(eq(RedisStreamKey.TEST_DLQ), eq(message));
        verify(retryPublisher, never()).publish(any(), any());
    }

    @Test
    void 추상_메서드_미구현시_예외_발생() {
        RedisStreamRetryHandler<DummyMessage> incomplete = new RedisStreamRetryHandler<>(retryPublisher, dlqPublisher,
                Duration.ofSeconds(1), Duration.ofSeconds(10)) {
        };

        DummyMessage dummy = new DummyMessage(1, LocalDateTime.now(), TIMEOUT);

        assertThrows(UnsupportedOperationException.class, () -> incomplete.getRetryStreamKey());
        assertThrows(UnsupportedOperationException.class, () -> incomplete.getDLQStreamKey());
        assertThrows(UnsupportedOperationException.class,
                () -> incomplete.updateRetryFields(dummy, 2, LocalDateTime.now()));
    }

    @Test
    void 지수_백오프_계산이_정확히_반영된다() {
        DummyMessage input = new DummyMessage(2, LocalDateTime.now(), TIMEOUT);

        DummyRetryHandler handler = new DummyRetryHandler(retryPublisher, dlqPublisher,
                Duration.ofSeconds(1), Duration.ofSeconds(5)) {
            @Override
            protected DummyMessage updateRetryFields(DummyMessage original, int retryCount, LocalDateTime nextRetryAt) {
                // 기대: 1s × 2^2 = 4s (baseDelay 1s, retryCount=2)
                long expectedDelay = 4_000L;
                long actualDelay = Duration.between(LocalDateTime.now(), nextRetryAt).toMillis();
                // 200ms 정도 허용 오차
                assertTrue(Math.abs(actualDelay - expectedDelay) < 200);
                return super.updateRetryFields(original, retryCount, nextRetryAt);
            }
        };

        handler.handleRetry(input);
    }

    static class DummyMessage implements RedisRetryableMessage {
        private final int retryCount;
        private final LocalDateTime nextRetryAt;
        private final RetryFailReason failReason;

        DummyMessage(int retryCount, LocalDateTime nextRetryAt, RetryFailReason failReason) {
            this.retryCount = retryCount;
            this.nextRetryAt = nextRetryAt;
            this.failReason = failReason;
        }

        @Override
        public int getRetryCount() {
            return retryCount;
        }

        @Override
        public LocalDateTime getNextRetryAt() {
            return nextRetryAt;
        }

        @Override
        public LocalDateTime getExpireAt() {
            return nextRetryAt.plusMinutes(5);
        }

        @Override
        public RetryFailReason getRetryFailReason() {
            return failReason;
        }
    }

    static class DummyRetryHandler extends RedisStreamRetryHandler<DummyMessage> {
        DummyRetryHandler(RedisStreamWriter<DummyMessage> retryPublisher,
                          RedisStreamWriter<DummyMessage> dlqPublisher,
                          Duration baseDelay, Duration maxDelay) {
            super(retryPublisher, dlqPublisher, baseDelay, maxDelay);
        }

        @Override
        protected RedisStreamKey getRetryStreamKey() {
            return RedisStreamKey.TEST_RETRY;
        }

        @Override
        protected RedisStreamKey getDLQStreamKey() {
            return RedisStreamKey.TEST_DLQ;
        }

        @Override
        protected DummyMessage updateRetryFields(DummyMessage original, int retryCount, LocalDateTime nextRetryAt) {
            return new DummyMessage(retryCount, nextRetryAt, original.failReason);
        }
    }
}
