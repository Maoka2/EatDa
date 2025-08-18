package com.domain.menu.dto.redis;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.global.constants.AssetType;
import com.global.constants.ErrorCode;
import com.global.exception.ApiException;
import com.global.redis.dto.AbstractRedisStreamMessage;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

import static com.global.redis.constants.RedisConstants.STREAM_EVENT_ASSET_TTL;

@Getter
@SuperBuilder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MenuPosterAssetGenerateMessage extends AbstractRedisStreamMessage {
    private final Long menuPostAssetId;
    private final AssetType type;
    private final String prompt;
    private final Long storeId;
    private final Long userId;
    private final List<MenuItem> menuItems;  // Menu 엔티티 → MenuItem DTO로 변경
    private final List<String> referenceImages;
    private final Instant requestedAt;

    // MenuItem 내부 레코드 추가
    public static record MenuItem(
            Long id,
            String name,
            String description,
            String imageUrl
    ) {}

    public static MenuPosterAssetGenerateMessage of(
            Long menuPostAssetId,
            AssetType type,
            String prompt,
            Long storeId,
            Long userId,
            List<MenuItem> menuItems,  // 파라미터 타입 변경
            List<String> referenceImages
    ) {
        validateRequiredFields(menuPostAssetId, type, prompt, storeId, userId, menuItems, referenceImages);

        Instant requestedAt = Instant.now();

        return MenuPosterAssetGenerateMessage.builder()
                .menuPostAssetId(menuPostAssetId)
                .type(type)
                .prompt(prompt)
                .storeId(storeId)
                .userId(userId)
                .menuItems(menuItems)  // 필드명 변경
                .referenceImages(referenceImages)
                .requestedAt(requestedAt)
                .expireAt(calculateExpireAt(STREAM_EVENT_ASSET_TTL))
                .retryCount(INITIAL_RETRY_COUNT)
                .nextRetryAt(null)
                .retryFailReason(null)
                .build();
    }

    private static void validateRequiredFields(
            Long menuPostAssetId,
            AssetType type,
            String prompt,
            Long storeId,
            Long userId,
            List<MenuItem> menuItems,  // 파라미터 타입 변경
            List<String> imageUrls
    ) {
        if (Objects.isNull(menuPostAssetId) ||
                Objects.isNull(type) ||
                Objects.isNull(prompt) || prompt.isBlank() ||
                Objects.isNull(storeId) ||
                Objects.isNull(userId) ||
                Objects.isNull(menuItems) || menuItems.isEmpty() ||  // 빈 리스트 체크 추가
                Objects.isNull(imageUrls) || imageUrls.isEmpty()) {  // 빈 리스트 체크 추가
            throw new ApiException(ErrorCode.REQUIRED_MENU_FIELDS_MISSING);
        }
    }
}
