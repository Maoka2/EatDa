package com.domain.review.controller;

import com.domain.review.constants.ReviewConstants;
import com.domain.review.dto.request.ReviewAssetCallbackRequest;
import com.domain.review.dto.request.ReviewAssetCreateRequest;
import com.domain.review.dto.request.ReviewFinalizeRequest;
import com.domain.review.dto.response.MyReviewResponse;
import com.domain.review.dto.response.ReviewAssetRequestResponse;
import com.domain.review.dto.response.ReviewAssetResultResponse;
import com.domain.review.dto.response.ReviewDetailResponse;
import com.domain.review.dto.response.ReviewFeedResponse;
import com.domain.review.dto.response.ReviewFeedResult;
import com.domain.review.dto.response.ReviewFinalizeResponse;
import com.domain.review.dto.response.ReviewScrapResult;
import com.domain.review.service.ReviewScrapService;
import com.domain.review.service.ReviewService;
import com.domain.review.validator.SeoulLocation;
import com.global.config.swagger.annotation.ApiInternalServerError;
import com.global.config.swagger.annotation.ApiUnauthorizedError;
import com.global.constants.ErrorCode;
import com.global.constants.SuccessCode;
import com.global.dto.response.ApiResponseFactory;
import com.global.dto.response.BaseResponse;
import com.global.dto.response.SuccessResponse;
import com.global.exception.ApiException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final ReviewScrapService reviewScrapService;

    @Operation(
            summary = "1단계 - 리뷰 에셋 생성 요청",
            description = """
                    리뷰 생성을 위한 이미지 및 프롬프트를 전송합니다.
                    ※ Swagger UI에서는 파일 배열 전송이 완전하게 지원되지 않으므로, Postman 또는 클라이언트 환경에서 테스트해주세요.
                    """,
            responses = {
                    @ApiResponse(
                            responseCode = "202",
                            description = "리뷰 에셋 생성 요청이 접수됨",
                            content = @Content(
                                    mediaType = "application/json",
                                    schema = @Schema(implementation = ReviewAssetRequestResponse.class),
                                    examples = @ExampleObject(
                                            name = "ReviewAssetRequestSuccess",
                                            summary = "리뷰 에셋 생성 요청 성공 응답 예시",
                                            value = """
                                                    {
                                                      "code": "REVIEW_ASSET_REQUESTED",
                                                      "message": "리뷰 에셋 생성 요청이 접수되었습니다.",
                                                      "status": 202,
                                                      "data": {
                                                        "reviewId": 1,
                                                        "reviewAssetId": 102
                                                      },
                                                      "timestamp": "2025-07-25T14:20:00Z"
                                                    }
                                                    """
                                    )
                            )
                    )
            }
    )
    @ApiUnauthorizedError
    @ApiInternalServerError
    @PostMapping(value = "/assets", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BaseResponse> requestReviewAsset(
            @ModelAttribute final ReviewAssetCreateRequest request,
            @RequestHeader(value = "X-User-Id", required = false) final Long userId
    ) {
        ReviewAssetRequestResponse response = reviewService.requestReviewAsset(request, userId);
        return ApiResponseFactory.success(SuccessCode.REVIEW_ASSET_REQUESTED, response);
    }

    @Operation(
            summary = "2단계 - 리뷰 에셋 콜백 처리",
            description = """
                    FastAPI로부터 리뷰 생성 결과 콜백을 수신합니다.
                    생성 결과는 성공(SUCCESS) 또는 실패(FAIL)이며, 성공 시 assetUrl을 포함해야 합니다.
                    """
            ,
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "리뷰 에셋 콜백 처리 성공",
                            content = @Content(
                                    mediaType = "application/json",
                                    schema = @Schema(implementation = BaseResponse.class),
                                    examples = @ExampleObject(
                                            name = "ReviewAssetCallbackSuccess",
                                            summary = "리뷰 에셋 콜백 성공 응답 예시",
                                            value = """
                                                    {
                                                      "code": "REVIEW_ASSET_RECEIVED",
                                                      "message": "리뷰 에셋 콜백이 정상적으로 처리되었습니다.",
                                                      "status": 200,
                                                      "data": null,
                                                      "timestamp": "2025-07-25T14:20:00Z"
                                                    }
                                                    """
                                    )
                            )
                    )
            }
    )
    @ApiUnauthorizedError
    @ApiInternalServerError
    @PostMapping("/assets/callback")
    public ResponseEntity<BaseResponse> handleReviewAssetCallback(
            @Valid @RequestBody final ReviewAssetCallbackRequest request) {
        reviewService.handleReviewAssetCallback(request);
        return ApiResponseFactory.success(SuccessCode.REVIEW_ASSET_RECEIVED);
    }

    @Operation(
            summary = "리뷰 에셋 결과 조회",
            description = """
                    에셋 생성 결과 URL을 확인합니다.
                    생성이 완료된 경우 type과 assetUrl을 반환합니다.
                    """,
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "리뷰 에셋 생성 결과 조회 성공",
                            content = @Content(
                                    mediaType = "application/json",
                                    schema = @Schema(implementation = ReviewAssetResultResponse.class),
                                    examples = @ExampleObject(
                                            name = "ReviewAssetResultSuccess",
                                            summary = "리뷰 에셋 생성 성공 응답 예시",
                                            value = """
                                                    {
                                                      "code": "REVIEW_ASSET_GENERATION_SUCCESS",
                                                      "message": "리뷰 에셋 생성이 완료되었습니다.",
                                                      "status": 200,
                                                      "data": {
                                                        "type": "IMAGE",
                                                        "assetUrl": "https://cdn.example.com/reviews/abc123.png"
                                                      },
                                                      "timestamp": "2025-07-25T16:00:00Z"
                                                    }
                                                    """
                                    )
                            )
                    )
            }
    )
    @ApiUnauthorizedError
    @ApiInternalServerError
    @GetMapping("/assets/{reviewAssetId}/result")
    public ResponseEntity<BaseResponse> getReviewAssetResult(@PathVariable final Long reviewAssetId) {
        ReviewAssetResultResponse response = reviewService.getReviewAssetResult(reviewAssetId);
        return ApiResponseFactory.success(SuccessCode.REVIEW_ASSET_GENERATION_SUCCESS, response);
    }

    @Operation(
            summary = "3단계 - 리뷰 최종 등록",
            description = """
                    에셋 결과와 설명, 메뉴 ID들을 포함해 리뷰를 최종 등록합니다.
                    """,
            responses = {
                    @ApiResponse(
                            responseCode = "200",
                            description = "리뷰 최종 등록 성공",
                            content = @Content(
                                    mediaType = "application/json",
                                    schema = @Schema(implementation = ReviewFinalizeResponse.class),
                                    examples = @ExampleObject(
                                            name = "ReviewFinalizeSuccess",
                                            summary = "리뷰 최종 등록 성공 응답 예시",
                                            value = """
                                                    {
                                                      "code": "REVIEW_REGISTERED",
                                                      "message": "리뷰가 성공적으로 등록되었습니다.",
                                                      "status": 200,
                                                      "data": {
                                                        "reviewId": 123
                                                      },
                                                      "timestamp": "2025-07-25T15:15:00Z"
                                                    }
                                                    """
                                    )
                            )
                    )
            }
    )
    @ApiUnauthorizedError
    @ApiInternalServerError
    @PostMapping("/finalize")
    public ResponseEntity<BaseResponse> finalizeReview(
            @Valid @RequestBody final ReviewFinalizeRequest request) {
        ReviewFinalizeResponse response = reviewService.finalizeReview(request);
        return ApiResponseFactory.success(SuccessCode.REVIEW_REGISTERED, response);
    }

    /**
     * 위치 기반 리뷰 피드 조회
     *
     * @param latitude     사용자 위도 (필수, 서울 지역 범위)
     * @param longitude    사용자 경도 (필수, 서울 지역 범위)
     * @param distance     조회 반경 (선택, 기본값: 500m, 허용값: 300, 500, 700, 850, 1000, 2000)
     * @param lastReviewId 무한스크롤용 마지막 리뷰 ID (선택)
     * @return 리뷰 피드 목록
     */
    @GetMapping("/feed")
    public ResponseEntity<BaseResponse> getReviewFeed(
            @RequestParam
            @NotNull(message = "위도는 필수입니다")
            @SeoulLocation(type = SeoulLocation.LocationType.LATITUDE, message = "위도는 서울 지역 범위여야 합니다")
            Double latitude,

            @RequestParam
            @NotNull(message = "경도는 필수입니다")
            @SeoulLocation(type = SeoulLocation.LocationType.LONGITUDE, message = "경도는 서울 지역 범위여야 합니다")
            Double longitude,

            @RequestParam(defaultValue = "500")
            Integer distance,

            @RequestParam(required = false)
            Long lastReviewId
    ) {
        log.info("Review feed request - lat: {}, lon: {}, distance: {}m, lastReviewId: {}",
                latitude, longitude, distance, lastReviewId);

        if (!ReviewConstants.SEARCH_DISTANCES.contains(distance)) {
            throw new IllegalArgumentException("거리는 300, 500, 700, 850, 1000, 2000m 중 하나여야 합니다");
        }

        ReviewFeedResult<ReviewFeedResponse> result = reviewService.getReviewFeed(
                latitude, longitude, distance, lastReviewId
        );

        String code = result.nearbyReviewsFound() ? "FEED_FETCHED" : "FEED_FALLBACK";
        String message = result.nearbyReviewsFound()
                ? "리뷰 피드가 성공적으로 조회되었습니다."
                : "주변에 리뷰가 없어 전체 피드를 제공합니다.";

        SuccessResponse<ReviewFeedResult<ReviewFeedResponse>> response =
                SuccessResponse.of(code, message, 200, result);

        return ResponseEntity.ok(response);
    }

    /**
     * 리뷰 상세 정보 조회
     *
     * @param reviewId 조회할 리뷰 ID (필수)
     * @param userId   현재 로그인한 사용자 ID (인증 시 자동 주입, 스크랩 여부 판단용)
     * @return 리뷰 상세 정보
     */
    @GetMapping("/{reviewId}")
    public ResponseEntity<BaseResponse> getReviewDetail(
            @PathVariable
            @NotNull(message = "리뷰 ID는 필수입니다")
            @Positive(message = "리뷰 ID는 양수여야 합니다")
            Long reviewId,
            @RequestHeader(value = "X-User-Id", required = false)
            Long userId
            //            @AuthenticationPrincipal Long userId  //
    ) {
        log.info("Review detail request - reviewId: {}, userId: {}", reviewId, userId);

        ReviewDetailResponse reviewDetail = reviewService.getReviewDetail(reviewId, userId);

        SuccessResponse<ReviewDetailResponse> response = SuccessResponse.of(
                "REVIEW_DETAIL_FETCHED",
                "리뷰 상세정보를 성공적으로 조회했습니다.",
                200,
                reviewDetail
        );

        return ResponseEntity.ok(response);
    }

    /**
     * 내 리뷰 목록 조회
     */
    @GetMapping("/me")
    public ResponseEntity<BaseResponse> getMyReviews(
            @RequestParam(required = false) Long lastReviewId,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestHeader(value = "X-User-Id", required = false) Long userId
            //            @AuthenticationPrincipal Long userId  // 또는 @CurrentUser Long userId
    ) {
        log.info("My reviews request - userId: {}, lastReviewId: {}, pageSize: {}",
                userId, lastReviewId, pageSize);

        // 인증 체크
        if (userId == null) {
            throw new ApiException(ErrorCode.UNAUTHORIZED);
        }

        // 서비스 호출
        ReviewFeedResult<MyReviewResponse> result = reviewService.getMyReviews(
                userId, lastReviewId, pageSize
        );

        // 응답 생성
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("reviews", result.reviews());
        responseData.put("hasNext", result.hasNext());

        SuccessResponse<Map<String, Object>> response = SuccessResponse.of(
                "MY_REVIEWS_FETCHED",
                "사용자 리뷰 목록을 성공적으로 조회했습니다.",
                200,
                responseData
        );

        return ResponseEntity.ok(response);
    }

    /**
     * 리뷰 스크랩 토글 (추가/해제)
     *
     * @param reviewId 스크랩할 리뷰 ID (필수)
     * @param userId   현재 로그인한 사용자 ID (필수)
     * @return 스크랩 결과 (스크랩 여부, 현재 스크랩 수)
     */
    @PostMapping("/{reviewId}/scrap/toggle")
    public ResponseEntity<BaseResponse> toggleReviewScrap(
            @PathVariable
            @NotNull(message = "리뷰 ID는 필수입니다")
            @Positive(message = "리뷰 ID는 양수여야 합니다")
            Long reviewId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId
            //            @AuthenticationPrincipal Long userId
    ) {
        log.info("Scrap toggle request - reviewId: {}, userId: {}", reviewId, userId);

        // 인증 체크
        if (userId == null) {
            log.warn("Unauthorized scrap toggle attempt for review: {}", reviewId);
            throw new ApiException(ErrorCode.UNAUTHORIZED);
        }

        try {
            // 서비스 호출
            ReviewScrapResult result = reviewScrapService.toggleScrap(reviewId, userId);

            // 응답 메시지 분기
            String message = result.isNewScrap()
                    ? "리뷰를 스크랩했습니다."
                    : "리뷰 스크랩을 해제했습니다.";

            // 응답 데이터 구성
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("isScrapped", result.isNewScrap());
            responseData.put("scrapCount", result.scrapCount());

            SuccessResponse<Map<String, Object>> response = SuccessResponse.of(
                    "REVIEW_SCRAP_TOGGLED",
                    message,
                    200,
                    responseData
            );

            log.info("Scrap toggle successful - reviewId: {}, userId: {}, isScrapped: {}",
                    reviewId, userId, result.isNewScrap());

            return ResponseEntity.ok(response);

        } catch (ApiException e) {
            // 비즈니스 예외는 그대로 전파
            log.warn("Business exception during scrap toggle - reviewId: {}, error: {}",
                    reviewId, e.getErrorCode());
            throw e;
        } catch (Exception e) {
            // 예상치 못한 예외
            log.error("Unexpected error during scrap toggle - reviewId: {}, userId: {}",
                    reviewId, userId, e);
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 리뷰 삭제
     *
     * @param reviewId 삭제할 리뷰 ID (필수)
     * @param userId   현재 로그인한 사용자 ID (필수)
     * @return 삭제 완료 응답
     */
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<BaseResponse> deleteReview(
            @PathVariable
            @NotNull(message = "리뷰 ID는 필수입니다")
            @Positive(message = "리뷰 ID는 양수여야 합니다")
            Long reviewId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId
            //            @AuthenticationPrincipal Long userId
    ) {
        log.info("Delete review request - reviewId: {}, userId: {}", reviewId, userId);

        // 인증 체크
        if (userId == null) {
            log.warn("Unauthorized delete attempt for review: {}", reviewId);
            throw new ApiException(ErrorCode.UNAUTHORIZED);
        }

        try {
            // 서비스 호출 (작성자 확인 및 삭제 처리)
            reviewService.removeReview(reviewId, userId);

            // 성공 응답
            SuccessResponse<?> response = SuccessResponse.of(
                    "REVIEW_DELETED",
                    "리뷰가 성공적으로 삭제되었습니다.",
                    200
            );

            log.info("Review deleted successfully - reviewId: {}, userId: {}", reviewId, userId);

            return ResponseEntity.ok(response);

        } catch (ApiException e) {
            // 비즈니스 예외는 그대로 전파
            log.warn("Business exception during review deletion - reviewId: {}, error: {}",
                    reviewId, e.getErrorCode());
            throw e;
        } catch (Exception e) {
            // 예상치 못한 예외
            log.error("Unexpected error during review deletion - reviewId: {}, userId: {}",
                    reviewId, userId, e);
            throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}
