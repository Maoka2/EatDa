package com.domain.review.service.impl;

import static com.global.constants.ErrorCode.FORBIDDEN;
import static com.global.constants.ErrorCode.STORE_NOT_FOUND;

import com.domain.menu.entity.Menu;
import com.domain.menu.repository.MenuRepository;
import com.domain.review.constants.ReviewAssetType;
import com.domain.review.constants.ReviewConstants;
import com.domain.review.dto.redis.ReviewAssetGenerateMessage;
import com.domain.review.dto.request.ReviewAssetCallbackRequest;
import com.domain.review.dto.request.ReviewAssetCreateRequest;
import com.domain.review.dto.request.ReviewFinalizeRequest;
import com.domain.review.dto.request.ReviewLocationRequest;
import com.domain.review.dto.response.MyReviewResponse;
import com.domain.review.dto.response.PaginationResult;
import com.domain.review.dto.response.ReviewAssetRequestResponse;
import com.domain.review.dto.response.ReviewAssetResultResponse;
import com.domain.review.dto.response.ReviewDetailResponse;
import com.domain.review.dto.response.ReviewFeedResponse;
import com.domain.review.dto.response.ReviewFeedResult;
import com.domain.review.dto.response.ReviewFinalizeResponse;
import com.domain.review.dto.response.StoreDistanceResult;
import com.domain.review.entity.Poi;
import com.domain.review.entity.Review;
import com.domain.review.entity.ReviewAsset;
import com.domain.review.entity.ReviewMenu;
import com.domain.review.entity.ReviewScrap;
import com.domain.review.mapper.ReviewMapper;
import com.domain.review.publisher.ReviewAssetRedisPublisher;
import com.domain.review.repository.ReviewAssetRepository;
import com.domain.review.repository.ReviewMenuRepository;
import com.domain.review.repository.ReviewRepository;
import com.domain.review.service.PoiStoreDistanceService;
import com.domain.review.service.ReviewAssetService;
import com.domain.review.service.ReviewService;
import com.domain.review.service.ReviewThumbnailService;
import com.domain.review.validator.ReviewValidator;
import com.domain.store.entity.Store;
import com.domain.store.repository.StoreRepository;
import com.domain.user.entity.User;
import com.domain.user.repository.EaterRepository;
import com.domain.user.repository.MakerRepository;
import com.global.config.FileStorageProperties;
import com.global.constants.ErrorCode;
import com.global.constants.Status;
import com.global.exception.ApiException;
import com.global.filestorage.FileStorageService;
import com.global.filestorage.FileUrlResolver;
import java.net.URI;
import java.nio.file.Path;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private static final String IMAGE_BASE_PATH = "reviews/";
    private static final String DATA_DIR = "data";
    private static final String SHORTS_DIR = "shorts";

    // === Repository 및 의존성 주입 ===
    private final ReviewRepository reviewRepository;
    private final ReviewAssetRepository reviewAssetRepository;
    private final ReviewMenuRepository reviewMenuRepository;
    private final EaterRepository eaterRepository;
    private final MakerRepository makerRepository;
    private final MenuRepository menuRepository;
    private final StoreRepository storeRepository;
    private final ReviewMapper reviewMapper;
    private final ReviewAssetRedisPublisher reviewAssetRedisPublisher;
    private final FileStorageService fileStorageService;
    private final PoiStoreDistanceService poiStoreDistanceService;
    private final ReviewAssetService reviewAssetService;

    private final ReviewThumbnailService reviewThumbnailService;
    private final FileStorageProperties fileStorageProperties;
    private final FileUrlResolver fileUrlResolver;

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
    public ReviewAssetRequestResponse requestReviewAsset(final ReviewAssetCreateRequest request,
                                                         final String eaterEmail) {
        User eater = findEaterByEmail(eaterEmail);
        Store store = storeRepository.findById(request.storeId())
                .orElseThrow(() -> new ApiException(STORE_NOT_FOUND));
        ReviewValidator.validateCreateRequest(request);

        Review review = createPendingReview(store, eater);
        ReviewAsset reviewAsset = createPendingReviewAsset(review, request);

        // 타입에 따라 WebP 변환 여부 결정
        boolean convertToWebp = shouldConvertToWebp(request.type());
        // 변환 여부를 넘겨서 업로드
        List<String> uploadedImageUrls = uploadImages(request.image(), IMAGE_BASE_PATH + eater.getEmail(),
                false);
        publishReviewAssetMessage(reviewAsset, eater.getId(), request, store, uploadedImageUrls); // Redis 메시지 발행

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

    // === 내부 헬퍼 메서드 ===

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

        if (Objects.isNull(asset.getType())) {
            throw new ApiException(ErrorCode.ASSET_TYPE_REQUIRED, reviewAssetId);
        }

        switch (asset.getType()) {
            case IMAGE -> {
                String imageUrl = asset.getImageUrl();
                if (Objects.isNull(imageUrl) || imageUrl.isBlank()) {
                    throw new ApiException(ErrorCode.REVIEW_ASSET_URL_REQUIRED, reviewAssetId);
                }
            }
            case SHORTS_RAY_2, SHORTS_GEN_4 -> {
                String shortsUrl = asset.getShortsUrl();
                if (Objects.isNull(shortsUrl) || shortsUrl.isBlank()) {
                    throw new ApiException(ErrorCode.REVIEW_ASSET_URL_REQUIRED, reviewAssetId);
                }
            }
            default -> throw new ApiException(ErrorCode.REVIEW_TYPE_INVALID, reviewAssetId);
        }

        return reviewMapper.toAssetResultResponse(asset);
    }

    /**
     * 리뷰 최종 등록 처리 - 설명 및 메뉴 연결 - 리뷰 상태를 성공으로 전환
     */
    @Override
    @Transactional
    public ReviewFinalizeResponse finalizeReview(final ReviewFinalizeRequest request, final String eaterEmail) {
        // 조회
        User eater = findEaterByEmail(eaterEmail);
        Review review = reviewRepository.findById(request.reviewId())
                .orElseThrow(() -> new ApiException(ErrorCode.REVIEW_NOT_FOUND, request.reviewId()));
        ReviewAsset asset = reviewAssetRepository.findById(request.reviewAssetId())
                .orElseThrow(() -> new ApiException(ErrorCode.REVIEW_ASSET_NOT_FOUND, request.reviewAssetId()));

        // 검증
        ReviewValidator.checkOwner(eater, review);
        ReviewValidator.checkReviewAssetReady(asset);
        ReviewValidator.checkAssetMatches(asset, request);

        // 도메인 업데이트
        asset.registerReview(review);
        String downloadedVideoPath = fileStorageService.storeVideoFromUrl(asset.getShortsUrl(), DATA_DIR, SHORTS_DIR);
        asset.updateShortsUrl(downloadedVideoPath);
        review.updateDescription(request.description());
        createReviewMenus(review, request.menuIds());
        review.updateStatus(Status.SUCCESS);
        return reviewMapper.toFinalizeResponse(review);
    }

    /**
     * 위치 기반 리뷰 피드 조회 POI를 찾고, 근처 매장의 리뷰를 거리순으로 제공 POI나 근처 리뷰가 없으면 전체 리뷰를 최신순으로 제공
     */
    @Override
    @Transactional(readOnly = true)
    public ReviewFeedResult<ReviewFeedResponse> getReviewFeed(final ReviewLocationRequest request,
                                                              final Integer distance,
                                                              final Long lastReviewId,
                                                              final String email) {
        // 1. 검증
        validatedToken(email);
        validateLocationParameters(request, distance);

        // 2. POI 조회
        Optional<Poi> poiOpt = findNearestPoi(request.latitude(), request.longitude());
        if (poiOpt.isEmpty()) {
            log.info("No POI found for location: lat={}, lon={}",
                    request.latitude(), request.longitude());
            return getFallbackFeed(lastReviewId);
        }

        // 3. 근처 매장 조회
        Poi poi = poiOpt.get();
        List<StoreDistanceResult> nearbyStores = getNearbyStores(poi.getId(), distance);
        if (nearbyStores.isEmpty()) {
            log.debug("No stores found within {}m from POI: {}", distance, poi.getName());
            return getFallbackFeed(lastReviewId);
        }

        // 4. 리뷰 조회 및 응답 생성
        return getNearbyReviewsFeed(nearbyStores, lastReviewId);
    }

    /**
     * 리뷰 상세 정보 조회
     */
    @Override
    @Transactional(readOnly = true)
    public ReviewDetailResponse getReviewDetail(final Long reviewId, final String email) {
        validatedToken(email);

        // 1. 리뷰 조회 (연관 엔티티 포함)
        Review review = reviewRepository.findByIdWithDetails(reviewId)
                .orElseThrow(() -> new ApiException(ErrorCode.REVIEW_NOT_FOUND));

        // 2. 연관 엔티티 null 체크
        validateReviewIntegrity(review);

        // 3. 스크랩 정보 계산
        List<ReviewScrap> scraps = review.getScraps();
        int scrapCount = scraps.size();
        boolean isScrapped = scraps.stream()
                .anyMatch(scrap -> scrap.getUser().getEmail().equals(email));

        // 4. 응답 생성
        return buildReviewDetailResponse(review, scrapCount, isScrapped);
    }

    /**
     * 내 리뷰 목록 조회
     */
    @Override
    @Transactional(readOnly = true)
    public ReviewFeedResult<MyReviewResponse> getMyReviews(final Long lastReviewId, final int pageSize,
                                                           final String eaterEmail) {
        User eater = findEaterByEmail(eaterEmail);

        if (pageSize <= 0 || pageSize > ReviewConstants.MAX_PAGE_SIZE) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR);
        }

        try {
            // 요청된 사이즈보다 1개 더 가져와서 hasNext 판단
            Pageable pageable = PageRequest.of(0, pageSize + 1);
            List<Review> reviews = reviewRepository.findMyReviews(eater.getId(), lastReviewId, pageable);

            // hasNext 판단 및 응답 생성
            boolean hasNext = reviews.size() > pageSize;
            List<Review> content = hasNext ? reviews.subList(0, pageSize) : reviews;

            List<MyReviewResponse> result = content.stream()
                    .map(this::buildMyReviewResponse)
                    .toList();

            return ReviewFeedResult.myReviews(result, hasNext);

        } catch (Exception e) {
            log.error("Database error while fetching user reviews", e);
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    @Transactional
    public void removeReview(final Long reviewId, final String eaterEmail) {
        try {
            User eater = findEaterByEmail(eaterEmail);

            Review review = reviewRepository.findById(reviewId)
                    .orElseThrow(() -> new ApiException(ErrorCode.REVIEW_NOT_FOUND));

            if (!review.getUser().getId().equals(eater.getId())) {
                throw new ApiException(FORBIDDEN);
            }

            reviewRepository.deleteById(reviewId);
            log.info("Review ID {} successfully deleted by User ID {}", reviewId, eater.getId());
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    // ===== Private Helper Methods =====

    /**
     * 위치 파라미터 검증
     */
    private void validateLocationParameters(ReviewLocationRequest request, Integer distance) {
        if (request.latitude() == null || request.longitude() == null || distance == null) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR);
        }

        if (request.latitude() < ReviewConstants.MIN_LATITUDE || request.latitude() > ReviewConstants.MAX_LATITUDE) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR);
        }

        if (request.longitude() < ReviewConstants.MIN_LONGITUDE
                || request.longitude() > ReviewConstants.MAX_LONGITUDE) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR);
        }

        if (!ReviewConstants.SEARCH_DISTANCES.contains(distance)) {
            throw new ApiException(ErrorCode.VALIDATION_ERROR);
        }
    }

    /**
     * 가장 가까운 POI 찾기 (실패 시 null 반환)
     */
    private Optional<Poi> findNearestPoi(double latitude, double longitude) {
        try {
            Poi nearestPoi = poiStoreDistanceService.findNearestPoi(latitude, longitude);
            if (nearestPoi == null) {
                return Optional.empty();
            }
            log.debug("Found nearest POI: id={}, name={}", nearestPoi.getId(), nearestPoi.getName());
            return Optional.of(nearestPoi);
        } catch (Exception e) {
            log.warn("Failed to find nearest POI: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * POI 기준 근처 매장 조회 (실패 시 빈 리스트 반환)
     */
    private List<StoreDistanceResult> getNearbyStores(Long poiId, int distance) {
        try {
            List<StoreDistanceResult> stores = poiStoreDistanceService.getNearbyStores(poiId, distance);
            return stores != null ? stores : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Failed to get nearby stores for POI {}: {}", poiId, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * 근처 매장들의 리뷰 피드 생성
     */
    private ReviewFeedResult<ReviewFeedResponse> getNearbyReviewsFeed(
            List<StoreDistanceResult> nearbyStores, Long lastReviewId) {

        List<Long> storeIds = nearbyStores.stream()
                .map(StoreDistanceResult::storeId)
                .toList();

        List<Review> reviews = fetchReviewsWithAssets(storeIds, lastReviewId);

        if (reviews.isEmpty()) {
            log.info("No reviews found for {} nearby stores, returning fallback feed", storeIds.size());
            return getFallbackFeed(lastReviewId);
        }

        PaginationResult<Review> paginationResult = applyPagination(reviews);

        // 응답 생성
        List<ReviewFeedResponse> feedResponses = paginationResult.content().stream()
                .map(this::buildNearbyReviewResponse)
                .toList();

        return ReviewFeedResult.nearbyReviews(feedResponses, paginationResult.hasNext());
    }

    /**
     * 전체 리뷰 피드 제공 (fallback)
     */
    private ReviewFeedResult<ReviewFeedResponse> getFallbackFeed(Long lastReviewId) {
        log.info("Providing fallback feed with lastReviewId: {}", lastReviewId);

        Pageable pageable = PageRequest.of(0,
                ReviewConstants.DEFAULT_PAGE_SIZE + ReviewConstants.PAGINATION_BUFFER);

        List<Review> reviews = reviewRepository.findAllOrderByIdDescWithAssets(lastReviewId, pageable);

        PaginationResult<Review> paginationResult = applyPagination(reviews);

        List<ReviewFeedResponse> feedResponses = paginationResult.content().stream()
                .map(this::buildFallbackReviewResponse)
                .toList();

        return ReviewFeedResult.fallbackReviews(feedResponses, paginationResult.hasNext());
    }

    /**
     * 리뷰 데이터 무결성 검증
     */
    private void validateReviewIntegrity(Review review) {
        if (review.getStore() == null) {
            log.error("Data integrity issue: Review {} has no associated store", review.getId());
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR);
        }

        if (review.getUser() == null) {
            log.error("Data integrity issue: Review {} has no associated user", review.getId());
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 근처 리뷰 응답 생성
     */
    private ReviewFeedResponse buildNearbyReviewResponse(Review review) {
        ReviewAsset asset = review.getReviewAsset();

        return ReviewFeedResponse.builder()
                .reviewId(review.getId())
                .storeName(review.getStore().getName())
                .description(review.getDescription())
                .menuNames(extractMenuNames(review))
                .imageUrl(asset != null ? asset.getImageUrl() : null)
                .shortsUrl(asset != null ? asset.getShortsUrl() : null)
                .thumbnailUrl(asset != null ? asset.getThumbnailPath() : null)
                .build();
    }

    /**
     * 전체 피드 리뷰 응답 생성
     */
    private ReviewFeedResponse buildFallbackReviewResponse(Review review) {
        validateReviewIntegrity(review);
        ReviewAsset asset = review.getReviewAsset();

        return ReviewFeedResponse.builder()
                .reviewId(review.getId())
                .storeName(review.getStore().getName())
                .description(review.getDescription())
                .menuNames(extractMenuNames(review))
                .imageUrl(asset != null ? asset.getImageUrl() : null)
                .shortsUrl(asset != null ? asset.getShortsUrl() : null)
                .thumbnailUrl(asset != null ? asset.getThumbnailPath() : null)
                .build();
    }

    /**
     * 내 리뷰 응답 생성
     */
    private MyReviewResponse buildMyReviewResponse(Review review) {
        validateReviewIntegrity(review);

        return MyReviewResponse.builder()
                .reviewId(review.getId())
                .storeName(review.getStore().getName())
                .description(review.getDescription())
                .menuNames(extractMenuNames(review))
                .imageUrl(review.getReviewAsset().getImageUrl())
                .shortsUrl(review.getReviewAsset().getShortsUrl())
                .thumbnailUrl(review.getReviewAsset().getThumbnailPath())
                .createdAt(review.getCreatedAt())
                .build();
    }

    /**
     * 리뷰 상세 응답 생성
     */
    private ReviewDetailResponse buildReviewDetailResponse(Review review, int scrapCount,
                                                           boolean isScrapped) {
        Store store = review.getStore();
        User user = review.getUser();
        ReviewAsset reviewAsset = review.getReviewAsset();

        ReviewDetailResponse.StoreInfo storeInfo = ReviewDetailResponse.StoreInfo.builder()
                .storeId(store.getId())
                .storeName(store.getName())
                .latitude(store.getLatitude())
                .longitude(store.getLongitude())
                .address(store.getAddress())
                .build();

        ReviewDetailResponse.UserInfo userInfo = ReviewDetailResponse.UserInfo.builder()
                .userId(user.getId())
                .nickname(user.getNickname())
                .build();

        return ReviewDetailResponse.builder()
                .reviewId(review.getId())
                .store(storeInfo)
                .user(userInfo)
                .description(review.getDescription())
                .createdAt(review.getCreatedAt())
                .asset(ReviewDetailResponse.AssetInfo.builder()
                        .type(reviewAsset.getType().name())
                        .imageUrl(reviewAsset.getImageUrl())
                        .shortsUrl(reviewAsset.getShortsUrl())
                        .thumbnailUrl(reviewAsset.getThumbnailPath())
                        .build())
                .scrapCount(scrapCount)
                .isScrapped(isScrapped)
                .menuNames(extractMenuNames(review))
                .build();
    }

    /**
     * 리뷰에 연결된 메뉴 이름 리스트 추출 - Review -> ReviewMenu -> Menu.name 경로로 안전하게 매핑 - null 안전 처리 및 중복 제거
     */
    private List<String> extractMenuNames(Review review) {
        if (review == null || review.getReviewMenus() == null) {
            return List.of();
        }
        return review.getReviewMenus().stream()
                .map(ReviewMenu::getMenu)
                .filter(Objects::nonNull)
                .map(Menu::getName)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    /**
     * 리뷰 생성 (대기 상태)
     */
    private Review createPendingReview(final Store store, final User user) {
        // 사용자 등록해야함
        return reviewRepository.save(reviewMapper.toPendingReview(store, user));
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
    private List<String> uploadImages(final List<MultipartFile> images, final String relativeBase,
                                      final boolean convertToWebp) {
        return images.stream()
                .map(file -> fileStorageService.storeImage(
                        file,
                        relativeBase,
                        file.getOriginalFilename(),
                        convertToWebp
                ))
                .toList();
    }

    private void updateAssetUrlIfSuccess(final ReviewAssetCallbackRequest request,
                                         final Status status,
                                         final ReviewAsset asset) {
        if (!status.isSuccess()) {
            return; // 실패면 URL 업데이트 없음
        }

        final String url = request.assetUrl();
        if (url == null || url.isBlank()) {
            throw new ApiException(ErrorCode.REVIEW_ASSET_URL_REQUIRED, asset.getId());
        }

        // 요청에 타입이 포함되어 있으므로 우선 사용하고, 없으면 엔티티 타입 사용
        final var type = request.type() != null ? request.type() : asset.getType();
        if (type == null) {
            throw new ApiException(ErrorCode.ASSET_TYPE_REQUIRED, asset.getId());
        }

        switch (type) {
            case IMAGE -> asset.updateImageUrl(url);
            case SHORTS_RAY_2, SHORTS_GEN_4 -> {
                // 1) SHORTS URL 저장
                asset.updateShortsUrl(url);

                // 2) 썸네일 생성 대상 경로/파일명 구성: {baseDir}/data/shorts/{email}/{fileName}.jpg
                final String email = asset.getReview().getUser().getEmail();
                final Path baseDir = fileStorageProperties.getBaseDirPath();
                final Path targetDir = baseDir
                        .resolve(DATA_DIR)
                        .resolve(SHORTS_DIR)
                        .resolve(email);

                final String fileName = deriveBaseName(url, "shorts-" + asset.getId());

                // 3) ffmpeg로 썸네일 추출
                final Path savedPath = reviewThumbnailService.extractThumbnail(url, targetDir.toString(), fileName);

                // 4) 퍼블릭 URL로 변환해서 엔티티에 저장
                final String publicUrl = fileUrlResolver.toPublicUrl(savedPath.toString());

                asset.updateThumbnailPath(publicUrl);
            }
            default -> throw new ApiException(ErrorCode.REVIEW_TYPE_INVALID, asset.getId());
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
    private void publishReviewAssetMessage(final ReviewAsset reviewAsset, final long userId,
                                           final ReviewAssetCreateRequest request,
                                           final Store store, final List<String> uploadedImageUrls) {

        // 메뉴 상세 객체 배열로 변환 (스펙: id/name/description/imageUrl)
        List<ReviewAssetGenerateMessage.MenuItem> menuItems =
                menuRepository.findAllById(request.menuIds()).stream()
                        .map(m -> new ReviewAssetGenerateMessage.MenuItem(
                                m.getId(),
                                m.getName(),
                                m.getDescription(),
                                m.getImageUrl() // 엔티티 필드명에 맞게 조정 필요
                        ))
                        .toList();

        ReviewAssetGenerateMessage message = reviewAssetService.prepareForRedis(
                reviewAsset.getId(),
                request.type(),
                request.prompt(),
                store.getId(),
                userId,
                menuItems,
                uploadedImageUrls
        );
        reviewAssetRedisPublisher.publish(message);
    }

    // IMAGE일 때만 true, SHORTS 계열은 false
    private boolean shouldConvertToWebp(ReviewAssetType type) {
        return type == ReviewAssetType.IMAGE;
    }

    private void validatedToken(final String email) {
        boolean isEater = eaterRepository.findByEmailAndDeletedFalse(email).isPresent();
        boolean isMaker = makerRepository.findByEmailAndDeletedFalse(email).isPresent();

        if (!isEater && !isMaker) {
            throw new ApiException(FORBIDDEN);
        }
    }

    private User findEaterByEmail(final String eaterEmail) {
        return eaterRepository.findByEmailAndDeletedFalse(eaterEmail)
                .orElseThrow(() -> new ApiException(FORBIDDEN));
    }

    // URL에서 파일명(확장자 제거)을 추출. 실패 시 fallbackName 사용
    private String deriveBaseName(String url, String fallbackName) {
        try {
            String path = new URI(url).getPath();
            if (path == null || path.isBlank()) {
                return fallbackName;
            }
            String name = path.substring(path.lastIndexOf('/') + 1);
            int dot = name.lastIndexOf('.');
            return (dot > 0 ? name.substring(0, dot) : name);
        } catch (Exception e) {
            return fallbackName;
        }
    }

    private List<Review> fetchReviewsWithAssets(List<Long> storeIds, Long lastReviewId) {
        Pageable pageable = PageRequest.of(0,
                ReviewConstants.DEFAULT_PAGE_SIZE + ReviewConstants.PAGINATION_BUFFER);

        try {
            return reviewRepository.findByStoreIdInOrderByIdDescWithAssets(storeIds, lastReviewId, pageable);
        } catch (Exception e) {
            log.error("Failed to fetch reviews for stores {}: {}", storeIds, e.getMessage());
            return Collections.emptyList();
        }
    }

    private Map<Long, Integer> createStoreDistanceMap(List<StoreDistanceResult> nearbyStores) {
        return nearbyStores.stream()
                .collect(Collectors.toMap(
                        StoreDistanceResult::storeId,
                        StoreDistanceResult::distance,
                        (existing, replacement) -> existing // 중복 키 처리
                ));
    }

    private PaginationResult<Review> applyPagination(List<Review> reviews) {
        boolean hasNext = reviews.size() > ReviewConstants.DEFAULT_PAGE_SIZE;
        List<Review> content = hasNext
                ? reviews.subList(0, ReviewConstants.DEFAULT_PAGE_SIZE)
                : reviews;

        return new PaginationResult<>(content, hasNext);
    }

}
