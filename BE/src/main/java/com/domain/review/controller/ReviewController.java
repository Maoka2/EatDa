package com.domain.review.controller;

import com.domain.review.dto.request.ReviewAssetCallbackRequest;
import com.domain.review.dto.request.ReviewAssetCreateRequest;
import com.domain.review.dto.request.ReviewFinalizeRequest;
import com.domain.review.dto.response.ReviewAssetRequestResponse;
import com.domain.review.dto.response.ReviewAssetResultResponse;
import com.domain.review.dto.response.ReviewFinalizeResponse;
import com.domain.review.service.ReviewService;
import com.global.constants.SuccessCode;
import com.global.dto.response.ApiResponseFactory;
import com.global.dto.response.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @Operation(summary = "1단계 - 리뷰 에셋 생성 요청", description = "리뷰 생성을 위한 이미지 및 프롬프트를 전송합니다.")
    @PostMapping("/assets")
    public ResponseEntity<BaseResponse> requestReviewAsset(@ModelAttribute final ReviewAssetCreateRequest request) {
        ReviewAssetRequestResponse response = reviewService.requestReviewAsset(request);
        return ApiResponseFactory.success(SuccessCode.REVIEW_ASSET_REQUESTED, response);
    }

    @Operation(summary = "2단계 - 리뷰 에셋 콜백 처리", description = "FastAPI로부터 리뷰 생성 결과 콜백을 수신합니다.")
    @PostMapping("/assets/callback")
    public ResponseEntity<BaseResponse> handleReviewAssetCallback(
            @Valid @RequestBody final ReviewAssetCallbackRequest request) {
        reviewService.handleReviewAssetCallback(request);
        return ApiResponseFactory.success(SuccessCode.REVIEW_ASSET_RECEIVED);
    }

    @Operation(summary = "리뷰 에셋 결과 조회", description = "에셋 생성 결과 URL을 확인합니다.")
    @GetMapping("/assets/{reviewAssetId}/result")
    public ResponseEntity<BaseResponse> getReviewAssetResult(@PathVariable final Long reviewAssetId) {
        ReviewAssetResultResponse response = reviewService.getReviewAssetResult(reviewAssetId);
        return ApiResponseFactory.success(SuccessCode.REVIEW_ASSET_GENERATION_SUCCESS, response);
    }

    @Operation(summary = "3단계 - 리뷰 최종 등록", description = "에셋 결과와 설명, 메뉴 ID들을 포함해 리뷰를 최종 등록합니다.")
    @PostMapping("/finalize")
    public ResponseEntity<BaseResponse> finalizeReview(@Valid @RequestBody final ReviewFinalizeRequest request) {
        ReviewFinalizeResponse response = reviewService.finalizeReview(request);
        return ApiResponseFactory.success(SuccessCode.REVIEW_REGISTERED, response);
    }
}
