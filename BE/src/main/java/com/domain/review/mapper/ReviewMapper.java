package com.domain.review.mapper;

import com.domain.review.constants.ReviewAssetType;
import com.domain.review.dto.request.ReviewAssetCreateRequest;
import com.domain.review.dto.response.ReviewAssetRequestResponse;
import com.domain.review.dto.response.ReviewAssetResultResponse;
import com.domain.review.dto.response.ReviewFinalizeResponse;
import com.domain.review.entity.Review;
import com.domain.review.entity.ReviewAsset;
import com.domain.store.entity.Store;
import com.domain.user.entity.User;
import com.global.constants.Status;
import java.util.Objects;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface ReviewMapper {

    // 리뷰 엔티티 생성 (대기 상태)
    default Review toPendingReview(Store store, User user) {
        return Review.builder()
                .store(store)
                .user(user)
                .status(Status.PENDING)
                .build();
    }

    // 리뷰 에셋 엔티티 생성 (대기 상태)
    default ReviewAsset toPendingReviewAsset(Review review, ReviewAssetCreateRequest request) {
        return ReviewAsset.builder()
                .review(review)
                .type(request.type())
                .prompt(request.prompt())
                .status(Status.PENDING)
                .build();
    }

    // 리뷰/리뷰에셋 → 생성 응답 DTO
    default ReviewAssetRequestResponse toRequestResponse(Review review, ReviewAsset asset) {
        return new ReviewAssetRequestResponse(review.getId(), asset.getId());
    }

    // 리뷰 → 최종 등록 응답 DTO
    @Mapping(source = "id", target = "reviewId")
    ReviewFinalizeResponse toFinalizeResponse(Review review);


    // 리뷰 에셋 → 결과 조회 응답 DTO
    default ReviewAssetResultResponse toAssetResultResponse(ReviewAsset asset) {
        if (Objects.isNull(asset) || asset.getType() == null) {
            return new ReviewAssetResultResponse(null, null, null);
        }

        String imageUrl = null;
        String shortsUrl = null;

        ReviewAssetType type = asset.getType();
        switch (type) {
            case IMAGE -> imageUrl = asset.getImageUrl();
            case SHORTS_RAY_2, SHORTS_GEN_4 -> shortsUrl = asset.getShortsUrl();
        }

        return new ReviewAssetResultResponse(type, imageUrl, shortsUrl);
    }
}
