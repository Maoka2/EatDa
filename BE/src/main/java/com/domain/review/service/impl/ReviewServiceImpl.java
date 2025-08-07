package com.domain.review.service.impl;

import static com.global.constants.ErrorCode.STORE_NOT_FOUND;

import com.domain.menu.entity.Menu;
import com.domain.menu.repository.MenuRepository;
import com.domain.review.dto.redis.ReviewAssetGenerateMessage;
import com.domain.review.dto.request.ReviewAssetCallbackRequest;
import com.domain.review.dto.request.ReviewAssetCreateRequest;
import com.domain.review.dto.request.ReviewFinalizeRequest;
import com.domain.review.dto.response.ReviewAssetRequestResponse;
import com.domain.review.dto.response.ReviewAssetResultResponse;
import com.domain.review.dto.response.ReviewFinalizeResponse;
import com.domain.review.entity.Review;
import com.domain.review.entity.ReviewAsset;
import com.domain.review.entity.ReviewMenu;
import com.domain.review.mapper.ReviewMapper;
import com.domain.review.publisher.ReviewAssetRedisPublisher;
import com.domain.review.repository.ReviewAssetRepository;
import com.domain.review.repository.ReviewMenuRepository;
import com.domain.review.repository.ReviewRepository;
import com.domain.review.service.ReviewService;
import com.domain.review.validator.ReviewValidator;
import com.domain.store.entity.Store;
import com.domain.store.repository.StoreRepository;
import com.global.constants.ErrorCode;
import com.global.constants.Status;
import com.global.exception.ApiException;
import com.global.filestorage.FileStorageService;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    // === Repository 및 의존성 주입 ===
    private final ReviewRepository reviewRepository;
    private final ReviewAssetRepository reviewAssetRepository;
    private final ReviewMenuRepository reviewMenuRepository;
    private final MenuRepository menuRepository;
    private final StoreRepository storeRepository;
    private final ReviewMapper reviewMapper;
    private final ReviewAssetRedisPublisher reviewAssetRedisPublisher;
    private final FileStorageService fileStorageService;

    // @formatter:off
    /**
     * 리뷰 에셋 생성 요청 처리
     * 1. 리뷰/에셋 엔티티 생성
     * 2. 이미지 업로드
     * 3. Redis Stream 메시지 발행
     */
    // @formatter:on
    @Override
    @Transactional
    public ReviewAssetRequestResponse requestReviewAsset(final ReviewAssetCreateRequest request) {
        Store store = storeRepository.findById(request.storeId())
                .orElseThrow(() -> new ApiException(STORE_NOT_FOUND));
        ReviewValidator.validateCreateRequest(request);

        Review review = createPendingReview(store);
        ReviewAsset reviewAsset = createPendingReviewAsset(review, request);

        List<String> uploadedImageUrls = uploadImages(request.image());
        publishReviewAssetMessage(reviewAsset, request, store, uploadedImageUrls); // Redis 메시지 발행

        return reviewMapper.toRequestResponse(review, reviewAsset);
    }

    /**
     * 리뷰 에셋 처리 결과 콜백 수신 - 성공/실패 여부에 따라 상태 및 URL 업데이트
     */
    @Override
    @Transactional
    public void handleReviewAssetCallback(final ReviewAssetCallbackRequest request) {
        ReviewAsset asset = reviewAssetRepository.findById(request.reviewAssetId())
                .orElseThrow(() -> new ApiException(ErrorCode.REVIEW_ASSET_NOT_FOUND));
        ReviewValidator.validateCallbackRequest(asset, request);

        Status status = Status.fromString(request.result());
        asset.updateStatus(status);

        updateAssetUrlIfSuccess(request, status, asset);
    }

    /**
     * 리뷰 에셋 결과 조회
     */
    @Override
    public ReviewAssetResultResponse getReviewAssetResult(final Long reviewAssetId) {
        ReviewAsset asset = reviewAssetRepository.findById(reviewAssetId)
                .orElseThrow(() -> new ApiException(ErrorCode.REVIEW_ASSET_NOT_FOUND, reviewAssetId));

        if (!asset.getStatus().isSuccess()) {
            throw new ApiException(ErrorCode.REVIEW_ASSET_NOT_READY, reviewAssetId);
        }

        if (Objects.isNull(asset.getAssetUrl()) || asset.getAssetUrl().isBlank()) {
            throw new ApiException(ErrorCode.REVIEW_ASSET_URL_REQUIRED, reviewAssetId);
        }

        return reviewMapper.toAssetResultResponse(asset);
    }

    /**
     * 리뷰 최종 등록 처리 - 설명 및 메뉴 연결 - 리뷰 상태를 성공으로 전환
     */
    @Override
    @Transactional
    public ReviewFinalizeResponse finalizeReview(final ReviewFinalizeRequest request) {
        // 리뷰 조회 및 상태 검증
        Review review = reviewRepository.findById(request.reviewId())
                .orElseThrow(() -> new ApiException(ErrorCode.REVIEW_NOT_FOUND, request.reviewId()));
        if (!review.getStatus().isSuccess()) {
            throw new ApiException(ErrorCode.REVIEW_NOT_SUCCESS, review.getId());
        }

        // 에셋 조회 및 상태 검증
        ReviewAsset asset = reviewAssetRepository.findById(request.reviewAssetId())
                .orElseThrow(() -> new ApiException(ErrorCode.REVIEW_ASSET_NOT_FOUND, request.reviewAssetId()));
        if (!Objects.equals(asset.getType(), request.type())) {
            throw new ApiException(ErrorCode.REVIEW_ASSET_TYPE_MISMATCH, asset.getType().name());
        }

        // 도메인 업데이트
        review.updateDescription(request.description());
        asset.registerReview(review);
        createReviewMenus(review, request.menuIds());

        review.updateStatus(Status.SUCCESS);
        return reviewMapper.toFinalizeResponse(review);
    }

    // === 내부 헬퍼 메서드 ===

    /**
     * 리뷰 생성 (대기 상태)
     */
    private Review createPendingReview(final Store store) {
        // 사용자 등록해야함
        return reviewRepository.save(reviewMapper.toPendingReview(store, null));
    }

    /**
     * 리뷰 에셋 생성 (대기 상태)
     */
    private ReviewAsset createPendingReviewAsset(final Review review, final ReviewAssetCreateRequest request) {
        ReviewAsset asset = reviewMapper.toPendingReviewAsset(review, request);
        return reviewAssetRepository.save(asset);
    }

    /**
     * 이미지 파일들을 로컬에 업로드하고 URL 반환
     */
    private List<String> uploadImages(final List<MultipartFile> images) {
        return images.stream()
                .map(file -> fileStorageService.storeImage(
                        file,
                        "reviews",
                        file.getOriginalFilename()
                ))
                .toList();
    }

    private void updateAssetUrlIfSuccess(final ReviewAssetCallbackRequest request,
                                         final Status status,
                                         final ReviewAsset asset) {
        if (status.isSuccess() && request.assetUrl() != null) {
            asset.updateAssetUrl(request.assetUrl());
        }
    }

    /**
     * 리뷰에 선택된 메뉴 연결
     */
    private void createReviewMenus(final Review review, final List<Long> menuIds) {
        List<Menu> menus = menuRepository.findAllById(menuIds);
        List<ReviewMenu> reviewMenus = menus.stream()
                .map(menu -> ReviewMenu.builder()
                        .review(review)
                        .menu(menu)
                        .build())
                .toList();
        reviewMenuRepository.saveAll(reviewMenus);
    }

    /**
     * Redis Stream 내 리뷰 에셋 생성 요청 메시지 발행
     */
    private void publishReviewAssetMessage(final ReviewAsset reviewAsset, final ReviewAssetCreateRequest request,
                                           final Store store, final List<String> uploadedImageUrls) {
        ReviewAssetGenerateMessage message = ReviewAssetGenerateMessage.of(
                reviewAsset.getId(),
                request.type(),
                request.prompt(),
                store.getId(),
                null, // 사용자 ID 지정 필요
                request.menuIds(),
                uploadedImageUrls
        );
        reviewAssetRedisPublisher.publish(message);
    }
}
