package com.domain.event.dto.redis;

import static com.global.redis.constants.RedisConstants.STREAM_EVENT_ASSET_TTL;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.global.constants.AssetType;
import com.global.constants.ErrorCode;
import com.global.exception.ApiException;
import com.global.redis.dto.AbstractRedisStreamMessage;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Getter
@SuperBuilder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EventAssetGenerateMessage extends AbstractRedisStreamMessage {

    private final Long assetId;
    private final AssetType type;
    private final String prompt;
    private final Long storeId;
    private final Long userId;
    private final String title;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private final LocalDate startDate;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private final LocalDate endDate;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private final LocalDateTime requestedAt;

    private final List<String> referenceImages;

    public static EventAssetGenerateMessage of(
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
        validateRequiredFields(assetId, type, prompt, storeId, userId, title, startDate, endDate);

        if (startDate.isAfter(endDate)) {
            throw new ApiException(ErrorCode.INVALID_EVENT_DATE_RANGE);
        }

        LocalDateTime now = LocalDateTime.now();

        return EventAssetGenerateMessage.builder()
                .assetId(assetId)
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
            LocalDate endDate
    ) {
        if (Objects.isNull(assetId) ||
                Objects.isNull(type) ||
                Objects.isNull(prompt) || prompt.isBlank() ||
                Objects.isNull(storeId) ||
                Objects.isNull(userId) ||
                Objects.isNull(title) || title.isBlank() ||
                Objects.isNull(startDate) ||
                Objects.isNull(endDate)) {
            throw new ApiException(ErrorCode.REQUIRED_EVENT_FIELDS_MISSING);
        }
    }

    public EventAssetGenerateMessage withRetry(LocalDateTime nextRetryAt) {
        return EventAssetGenerateMessage.builder()
                // 기존 필드 유지
                .assetId(this.assetId)
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
