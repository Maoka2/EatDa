package com.domain.menu.dto.redis;

import com.domain.menu.entity.Menu;
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
    private final List<Menu> menus;
    private final List<String> imageUrls;

    public final Instant requestedAt;

    public static MenuPosterAssetGenerateMessage of(
            Long menuPostAssetId,
            AssetType type,
            String prompt,
            Long storeId,
            Long userId,
            List<Menu> menus,
            List<String> imageUrls
    ) {
        validateRequiredFields(menuPostAssetId,  type, prompt, storeId, userId, menus, imageUrls);

        Instant requestedAt = Instant.now();

        return MenuPosterAssetGenerateMessage.builder()
                .menuPostAssetId(menuPostAssetId)
                .type(type)
                .prompt(prompt)
                .storeId(storeId)
                .userId(userId)
                .menus(menus)
                .imageUrls(imageUrls)
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
            List<Menu> menus,
            List<String> imageUrls
    ) {
        if (Objects.isNull(menuPostAssetId) ||
                Objects.isNull(type) ||
                Objects.isNull(prompt) || prompt.isBlank() ||
                Objects.isNull(storeId) ||
                Objects.isNull(userId) ||
                Objects.isNull(menus) ||
                Objects.isNull(imageUrls)) {
            throw new ApiException(ErrorCode.REQUIRED_MENU_FIELDS_MISSING);
        }
    }
}
