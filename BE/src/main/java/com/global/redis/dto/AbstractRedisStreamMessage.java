package com.global.redis.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.global.redis.constants.RetryFailReason;
import java.time.Duration;
import java.time.Instant;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

/**
 * Redis Stream 메시지의 공통 추상 클래스
 * - 모든 도메인의 Redis Stream 메시지가 상속받아 사용
 * - 재시도 관련 로직을 공통으로 처리
 */
@Getter
@SuperBuilder  // 자식 클래스에서도 빌더 패턴 사용 가능
@JsonInclude(JsonInclude.Include.NON_NULL)
public abstract class AbstractRedisStreamMessage implements RedisRetryableMessage {

    // ===== 재시도 관련 공통 필드 =====
    protected final Instant expireAt;            // 메시지 만료 시간 (UTC, ISO-8601)
    protected final int retryCount;              // 재시도 횟수
    protected final Instant nextRetryAt;         // 다음 재시도 예정 시각 (UTC, ISO-8601)
    protected final RetryFailReason retryFailReason; // 최종 실패 사유

    /**
     * 자식 클래스에서 초기 메시지 생성 시 사용할 protected 헬퍼
     * TTL을 받아서 만료 시간을 자동 계산
     */
    protected static Instant calculateExpireAt(Duration ttl) {
        return Instant.now().plus(ttl);
    }

    /**
     * 초기 재시도 카운트 (상수로 관리)
     */
    protected static final int INITIAL_RETRY_COUNT = 0;

    // ===== RedisRetryableMessage 인터페이스 구현 =====
    @Override
    public Instant getExpireAt() {
        return expireAt;
    }

    @Override
    public int getRetryCount() {
        return retryCount;
    }

    @Override
    public Instant getNextRetryAt() {
        return nextRetryAt;
    }

    @Override
    public RetryFailReason getRetryFailReason() {
        return retryFailReason;
    }

    /**
     * 메시지가 만료되었는지 확인
     */
    public boolean isExpired() {
        return expireAt != null && Instant.now().isAfter(expireAt);
    }

    /**
     * 재시도가 가능한지 확인
     */
    public boolean canRetry() {
        return !isExpired() && retryFailReason == null;
    }

    /**
     * 재시도 예정 시간이 되었는지 확인
     */
    public boolean isRetryTime() {
        return nextRetryAt != null && Instant.now().isAfter(nextRetryAt);
    }
}
