package com.domain.review.validator;

import static com.global.constants.ErrorCode.REVIEW_ASSET_NOT_FOUND;
import static com.global.constants.ErrorCode.REVIEW_ASSET_URL_REQUIRED;

import com.domain.review.constants.ReviewAssetType;
import com.domain.review.dto.request.ReviewAssetCallbackRequest;
import com.domain.review.dto.request.ReviewAssetCreateRequest;
import com.domain.review.dto.request.ReviewFinalizeRequest;
import com.domain.review.entity.Review;
import com.domain.review.entity.ReviewAsset;
import com.domain.user.entity.User;
import com.global.constants.ErrorCode;
import com.global.constants.Status;
import com.global.exception.ApiException;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
public class ReviewValidator {

    private static final long MAX_IMAGE_SIZE_MB = 10;
    private static final int IMAGE_BYTE = 1024;
    private static final Set<ReviewAssetType> SUPPORTED_TYPES = Set.of(
            ReviewAssetType.IMAGE,
            ReviewAssetType.SHORTS_GEN_4,
            ReviewAssetType.SHORTS_RAY_2
    );

    private static final String LOG_REVIEW_ASSET_NOT_FOUND =
            "[ReviewValidator] 리뷰 에셋이 존재하지 않음 - reviewAssetId: {}";

    private static final String LOG_ASSET_URL_REQUIRED_WHEN_SUCCESS =
            "[ReviewValidator] 성공 상태지만 assetUrl이 비어 있음 - reviewAssetId: {}";

    private static final String LOG_UNSUPPORTED_REVIEW_TYPE =
            "[ReviewValidator] 지원하지 않는 리뷰 에셋 타입 - type: {}";

    private static final String LOG_IMAGE_TOO_LARGE =
            "[ReviewValidator] 이미지 크기 초과 - filename: {}, size: {}MB";

    /**
     * 리뷰 에셋 생성 요청에 대한 유효성 검사
     */
    public static void validateCreateRequest(final ReviewAssetCreateRequest request) {
        validateType(request.type());
        validateImages(request.image());
    }

    /**
     * 리뷰 에셋 콜백 요청에 대한 유효성 검사
     */
    public static void validateCallbackRequest(final ReviewAsset asset, final ReviewAssetCallbackRequest request) {
        if (Objects.isNull(asset)) {
            log.warn(LOG_REVIEW_ASSET_NOT_FOUND, request.reviewAssetId());
            throw new ApiException(REVIEW_ASSET_NOT_FOUND, request.reviewAssetId());
        }

        if (Status.SUCCESS.name().equals(request.result()) &&
                (Objects.isNull(request.assetUrl()) || request.assetUrl().isBlank())) {
            log.warn(LOG_ASSET_URL_REQUIRED_WHEN_SUCCESS, asset.getId());
            throw new ApiException(REVIEW_ASSET_URL_REQUIRED);
        }
    }

    public static void checkOwner(final User eater, final Review review) {
        if (!Objects.equals(eater.getId(), review.getUser().getId())) {
            throw new ApiException(ErrorCode.REVIEW_OWNER_MISMATCH);
        }
    }

    public static void checkReviewAssetReady(final ReviewAsset asset) {
        if (!asset.getStatus().isSuccess()) {
            throw new ApiException(ErrorCode.REVIEW_ASSET_NOT_READY, asset.getId());
        }
    }

    public static void checkAssetMatches(final ReviewAsset asset, final ReviewFinalizeRequest req) {
        if (!Objects.equals(asset.getType(), req.type())) {
            throw new ApiException(ErrorCode.REVIEW_ASSET_TYPE_MISMATCH, asset.getType().name());
        }
    }

    private static void validateType(final ReviewAssetType type) {
        if (isNotSupportedType(type)) {
            log.warn(LOG_UNSUPPORTED_REVIEW_TYPE, type.name());
            throw new ApiException(ErrorCode.REVIEW_TYPE_INVALID, type.name());
        }
    }

    private static boolean isNotSupportedType(final ReviewAssetType type) {
        return !SUPPORTED_TYPES.contains(type);
    }

    /**
     * 이미지 유효성 검사 (형식, 크기 등)
     */
    private static void validateImages(final List<MultipartFile> images) {
        for (MultipartFile file : images) {
            if (file.getSize() > MAX_IMAGE_SIZE_MB * IMAGE_BYTE * IMAGE_BYTE) {
                log.warn(LOG_IMAGE_TOO_LARGE, file.getOriginalFilename(), file.getSize() / (IMAGE_BYTE * IMAGE_BYTE));
                throw new ApiException(ErrorCode.REVIEW_IMAGE_TOO_LARGE, file.getOriginalFilename());
            }
        }
    }
}
