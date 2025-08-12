package com.domain.event.dto.redis;

import static com.global.redis.constants.RedisConstants.STREAM_EVENT_ASSET_TTL;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.global.constants.AssetType;
import com.global.constants.ErrorCode;
import com.global.exception.ApiException;
import com.global.redis.dto.AbstractRedisStreamMessage;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EventAssetGenerateMessage extends AbstractRedisStreamMessage {

    private final Long eventAssetId;
    private final AssetType type;
    private final String prompt;
    private final Long storeId;
    private final Long userId;
    private final String title;

    private final LocalDate startDate;
    private final LocalDate endDate;

    // 요청 시각 (UTC, ISO-8601)
    private final Instant requestedAt;

    private final List<String> referenceImages;

    public static EventAssetGenerateMessage of(
            Long eventAssetId,
            AssetType type,
            String prompt,
            Long storeId,
            Long userId,
            String title,
            LocalDate startDate,
            LocalDate endDate,
            List<String> referenceImages
    ) {
        validateRequiredFields(eventAssetId, type, prompt, storeId, userId, title, startDate, endDate, referenceImages);

        if (startDate.isAfter(endDate)) {
            throw new ApiException(ErrorCode.INVALID_EVENT_DATE_RANGE);
        }

        Instant now = Instant.now();

        return EventAssetGenerateMessage.builder()
                .eventAssetId(eventAssetId)
                .type(type)
                .prompt(prompt)
                .storeId(storeId)
                .userId(userId)
                .title(title)
                .startDate(startDate)
                .endDate(endDate)
                .requestedAt(now)
                .referenceImages(referenceImages)
                .expireAt(calculateExpireAt(STREAM_EVENT_ASSET_TTL))
                .retryCount(INITIAL_RETRY_COUNT)
                .nextRetryAt(null)
                .retryFailReason(null)
                .build();
    }

    private static void validateRequiredFields(
            Long assetId,
            AssetType type,
            String prompt,
            Long storeId,
            Long userId,
            String title,
            LocalDate startDate,
            LocalDate endDate,
            List<String> referenceImages
    ) {
        if (Objects.isNull(assetId) ||
                Objects.isNull(type) ||
                Objects.isNull(prompt) || prompt.isBlank() ||
                Objects.isNull(storeId) ||
                Objects.isNull(userId) ||
                Objects.isNull(title) || title.isBlank() ||
                Objects.isNull(startDate) ||
                Objects.isNull(endDate) ||
                Objects.isNull(referenceImages)) {
            throw new ApiException(ErrorCode.REQUIRED_EVENT_FIELDS_MISSING);
        }
    }

    public EventAssetGenerateMessage withRetry(Instant nextRetryAt) {
        return EventAssetGenerateMessage.builder()
                // 기존 필드 유지
                .eventAssetId(this.eventAssetId)
                .type(this.type)
                .prompt(this.prompt)
                .storeId(this.storeId)
                .userId(this.userId)
                .title(this.title)
                .startDate(this.startDate)
                .endDate(this.endDate)
                .requestedAt(this.requestedAt)
                .referenceImages(this.referenceImages)
                // 재시도 관련 필드 업데이트
                .expireAt(this.expireAt)
                .retryCount(this.retryCount + 1)
                .nextRetryAt(nextRetryAt)
                .retryFailReason(null)
                .build();
    }
}
