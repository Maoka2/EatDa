package com.domain.review.entity;

import com.domain.review.constants.ReviewAssetType;
import com.global.constants.Status;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.sql.Struct;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Entity
@Table(name = "review_asset")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReviewAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false, unique = true)
    private Review review;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private ReviewAssetType type;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String shortsUrl;

    @Column(columnDefinition = "TEXT")
    private String thumbnailPath;

    @NotNull
    @Column(columnDefinition = "TEXT", nullable = false)
    private String prompt;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private Status status = Status.PENDING;

    @Builder
    public ReviewAsset(final Review review, final ReviewAssetType type, final String assetUrl, final String prompt,
                       final String thumbnailPath, final Status status) {
        this.review = review;
        this.type = type;
        switch (type) {
            case IMAGE -> this.imageUrl = assetUrl;
            case SHORTS_RAY_2, SHORTS_GEN_4 -> this.shortsUrl = assetUrl;
        }
        this.prompt = prompt;
        this.thumbnailPath = thumbnailPath;
        this.status = status != null ? status : Status.PENDING;
    }

    /**
     * AI 결과를 콜백받으면 '리뷰 에섯'의 status을 업데이트한다
     */
    public void updateStatus(final Status status) {
        this.status = status;
    }

    public void updateImageUrl(final String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void updateShortsUrl(final String shortsUrl) {
        this.shortsUrl = shortsUrl;
    }

    public void registerReview(final Review review) {
        this.review = review;
    }

    public void updateThumbnailPath(final String thumbnailPath) {
        this.thumbnailPath = thumbnailPath;
    }
}
