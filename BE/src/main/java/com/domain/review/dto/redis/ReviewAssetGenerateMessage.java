package com.domain.review.dto.redis;

import static com.global.redis.constants.RedisConstants.STREAM_REVIEW_ASSET_TTL;

import com.domain.review.constants.ReviewAssetType;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.global.redis.constants.RetryFailReason;
import com.global.redis.dto.RedisRetryableMessage;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Builder;

/**
 * 리뷰 에셋 생성을 위한 Redis 스트림 메시지 DTO - Redis Stream을 통해 AI 서버에 요청을 보낼 때 사용 - 재시도 관련 정보도 포함함
 */
@Builder(access = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL) // null 값인 필드는 직렬화 시 제외
public record ReviewAssetGenerateMessage(
        Long reviewAssetId,                 // 리뷰 에셋 ID
        ReviewAssetType type,              // 에셋 타입 (예: IMAGE, SHORTS)
        String prompt,                     // AI 생성용 프롬프트
        Long storeId,                      // 가게 ID
        Long userId,                       // 사용자 ID
        List<Long> menuIds,                // 메뉴 ID 목록
        List<String> imageUrls,            // 이미지 URL 목록

        // ===== Retry 관련 필드 =====
        LocalDateTime expireAt,            // 메시지 만료 시간
        int retryCount,                    // 재시도 횟수
        LocalDateTime nextRetryAt,         // 다음 재시도 예정 시각
        RetryFailReason retryFailReason    // 최종 실패 사유
) implements RedisRetryableMessage {

    private static final String REQUIRED_FIELDS_ERROR_MESSAGE = "reviewAssetId, type, storeId, userId는 필수입니다.";

    /**
     * 메시지 생성 팩토리 메서드 - 필수 필드 검증 수행 - 현재 시간 기준 만료 시간 계산
     */
    public static ReviewAssetGenerateMessage of(
            Long reviewAssetId,
            ReviewAssetType type,
            String prompt,
            Long storeId,
            Long userId,
            List<Long> menuIds,
            List<String> imageUrls
    ) {
        // 필수 필드 검증 (나중에 주석 제거)
        //        validateRequiredFields(reviewAssetId, type, storeId, userId);

        // TTL 적용
        LocalDateTime expireAt = LocalDateTime.now().plus(STREAM_REVIEW_ASSET_TTL);

        return new ReviewAssetGenerateMessage(
                reviewAssetId,
                type,
                prompt,
                storeId,
                userId,
                menuIds,
                imageUrls,
                expireAt,
                0,      // 최초 생성 시 retryCount는 0
                null,   // 재시도 예정 시각 없음
                null    // 실패 사유 없음
        );
    }

    /**
     * 필수 필드 검증 메서드 - 값이 null이면 예외 발생
     */
    private static void validateRequiredFields(Long reviewAssetId, ReviewAssetType type, Long storeId, Long userId) {
        if (Objects.isNull(reviewAssetId) || Objects.isNull(type) || Objects.isNull(storeId) || Objects.isNull(
                userId)) {
            throw new IllegalArgumentException(REQUIRED_FIELDS_ERROR_MESSAGE);
        }
    }

    // ===== RedisRetryableMessage 인터페이스 구현부 =====

    @Override
    public LocalDateTime getExpireAt() {
        return expireAt;
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
    public RetryFailReason getRetryFailReason() {
        return retryFailReason;
    }
}
