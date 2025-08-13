package com.domain.review.dto.redis;

import static com.global.redis.constants.RedisConstants.STREAM_REVIEW_ASSET_TTL;

import com.domain.review.constants.ReviewAssetType;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.global.redis.constants.RetryFailReason;
import com.global.redis.dto.RedisRetryableMessage;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Builder;

/**
 * 리뷰 에셋 생성 스트림 메시지 (스펙 준수)
 * - menu/referenceImages는 컬렉션 타입으로 보유하고,
 *   퍼블리셔가 Redis에 넣을 때 JSON 문자열로 직렬화한다.
 */
@Builder(access = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ReviewAssetGenerateMessage(
        Long reviewAssetId,                 // 리뷰 에셋 ID
        ReviewAssetType type,              // IMAGE | SHORTS_RAY_2 | SHORTS_GEN_4
        String prompt,                     // 프롬프트
        Long storeId,                      // 가게 ID
        Long userId,                       // 사용자 ID
        Instant requestedAt,               // 요청 시각 (UTC, ISO-8601)

        // ===== 스펙: menu (상세 객체 배열) / referenceImages (문자열 배열) =====
        List<MenuItem> menu,               // 선택한 메뉴 상세 정보 목록
        List<String> referenceImages,      // 참고 이미지 URL 목록

        // ===== Retry 관련 =====
        Instant expireAt,                  // 만료 시각 (UTC, ISO-8601)
        int retryCount,                    // 재시도 횟수
        Instant nextRetryAt,               // 다음 재시도 시각 (UTC, ISO-8601)
        RetryFailReason retryFailReason    // 실패 사유
) implements RedisRetryableMessage {

    private static final String REQUIRED_FIELDS_ERROR_MESSAGE =
            "reviewAssetId, type, storeId, userId, requestedAt는 필수입니다.";

    public static ReviewAssetGenerateMessage of(
            Long reviewAssetId,
            ReviewAssetType type,
            String prompt,
            Long storeId,
            Long userId,
            List<MenuItem> menu,
            List<String> referenceImages
    ) {
        // 운영 시 검증 활성화 권장
        // validateRequiredFields(reviewAssetId, type, storeId, userId);

        Instant now = Instant.now();
        Instant expireAt = now.plus(STREAM_REVIEW_ASSET_TTL);

        return new ReviewAssetGenerateMessage(
                reviewAssetId,
                type,
                prompt,
                storeId,
                userId,
                now,              // requestedAt
                menu,
                referenceImages,  // 스펙 필드명 준수
                expireAt,
                0,                // retryCount
                null,             // nextRetryAt
                null              // retryFailReason
        );
    }

    private static void validateRequiredFields(Long reviewAssetId, ReviewAssetType type,
                                               Long storeId, Long userId) {
        if (Objects.isNull(reviewAssetId) || Objects.isNull(type)
                || Objects.isNull(storeId) || Objects.isNull(userId)) {
            throw new IllegalArgumentException(REQUIRED_FIELDS_ERROR_MESSAGE);
        }
    }

    // ===== RedisRetryableMessage =====
    @Override public Instant getExpireAt() { return expireAt; }
    @Override public int getRetryCount() { return retryCount; }
    @Override public Instant getNextRetryAt() { return nextRetryAt; }
    @Override public RetryFailReason getRetryFailReason() { return retryFailReason; }

    /**
     * 메뉴 상세 스펙 객체
     */
    public record MenuItem(
            Long id,
            String name,
            String description,
            String imageUrl
    ) {}
}
