package com.global.utils;

import static com.global.constants.ErrorCode.ASSET_NOT_FOUND;

import com.global.constants.ErrorCode;
import com.global.constants.Status;
import com.global.dto.request.AssetCallbackRequest;
import com.global.entity.BaseAssetEntity;
import com.global.exception.ApiException;
import java.util.List;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
public class AssetValidator {
    private static final long MAX_IMAGE_SIZE_MB = 10;
    private static final long MIN_IMAGE_SIZE_KB = 700;
    private static final int IMAGE_BYTE = 1024;

    private static final String LOG_IMAGE_TOO_LARGE =
            "[AssetValidator] 이미지 크기 초과 - filename: {}, size: {}MB";

    private static final String LOG_IMAGE_TOO_SMALL =
            "[AssetValidator] 이미지 크기 부족 - filename: {}, size: {}MB";

    private static final String LOG_ASSET_NOT_FOUND =
            "[AssetValidator] 에셋이 존재하지 않음 - assetId: {}";

    private static final String LOG_ASSET_URL_REQUIRED_WHEN_SUCCESS =
            "[AssetValidator] 성공 상태지만 assetUrl이 비어 있음 - assetId: {}";

    public static void validateImages(final List<MultipartFile> images) throws ApiException {
        for (MultipartFile file : images) {
            if (file.getSize() > MAX_IMAGE_SIZE_MB * IMAGE_BYTE * IMAGE_BYTE) {
                log.warn(LOG_IMAGE_TOO_LARGE, file.getOriginalFilename(), file.getSize() / (IMAGE_BYTE * IMAGE_BYTE));
                throw new ApiException(ErrorCode.IMAGE_TOO_LARGE, file.getOriginalFilename());
            }
            if (file.getSize() < MIN_IMAGE_SIZE_KB * IMAGE_BYTE) {
                log.warn(LOG_IMAGE_TOO_SMALL, file.getOriginalFilename(), file.getSize() / IMAGE_BYTE);
                throw new ApiException(ErrorCode.IMAGE_TOO_SMALL, file.getOriginalFilename());
            }
        }
    }

    public static void validateCallbackRequest(final BaseAssetEntity asset, final AssetCallbackRequest<?> request) {
        if (Objects.isNull(asset)) {
            log.warn(LOG_ASSET_NOT_FOUND, request.assetId());
            throw new ApiException(ASSET_NOT_FOUND, request.assetId());
        }

        if (Status.SUCCESS.name().equals(request.result()) &&
                (Objects.isNull(request.assetUrl()) || request.assetUrl().isBlank())) {
            log.warn(LOG_ASSET_URL_REQUIRED_WHEN_SUCCESS, asset.getId());
            throw new ApiException(ASSET_NOT_FOUND);
        }
    }
}
