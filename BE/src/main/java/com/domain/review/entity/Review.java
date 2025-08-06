package com.domain.review.entity;

import com.domain.review.constants.ReviewStatus;
import com.domain.store.entity.Store;
import com.domain.user.entity.User;
import com.global.entity.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "review")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private ReviewStatus status = ReviewStatus.PENDING;

    @OneToOne(mappedBy = "review", cascade = CascadeType.ALL)
    private ReviewAsset reviewAsset;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<ReviewMenu> reviewMenus = new ArrayList<>();

    @Builder
    public Review(final User user, final Store store, final String description, final ReviewStatus status) {
        this.user = user;
        this.store = store;
        this.description = description;
        this.status = status != null ? status : ReviewStatus.PENDING;
    }

    public void updateStatus(final ReviewStatus status) {
        this.status = status;
    }

    public void updateDescription(final String description) {
        this.description = description;
    }
}
