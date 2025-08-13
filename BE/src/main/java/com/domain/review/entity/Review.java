package com.domain.review.entity;

import com.domain.store.entity.Store;
import com.domain.user.entity.User;
import com.global.constants.Status;
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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "review")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Review extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status = Status.PENDING;

    @OneToOne(mappedBy = "review", cascade = CascadeType.ALL)
    private ReviewAsset reviewAsset;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReviewScrap> scraps;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<ReviewMenu> reviewMenus = new ArrayList<>();

    //    @ElementCollection
    //    @CollectionTable(name = "review_menu", joinColumns = @JoinColumn(name = "review_id"))
    //    @Column(name = "menu_name")
    //    private List<String> menuNames = new ArrayList<>();

    @Builder
    public Review(final User user, final Store store, final String description, final Status status) {
        this.user = user;
        this.store = store;
        this.description = description;
        this.status = status != null ? status : Status.PENDING;
    }

    public void updateStatus(final Status status) {
        this.status = status;
    }

    public void updateDescription(final String description) {
        this.description = description;
    }

    /**
     * 이 리뷰의 스크랩 목록에 새로운 스크랩을 추가합니다. 양방향 관계를 유지하기 위해 ReviewScrap의 review도 설정합니다.
     *
     * @param scrap 추가할 ReviewScrap 객체
     */
    public void addScrap(ReviewScrap scrap) {
        if (scrap != null && !this.scraps.contains(scrap)) {
            this.scraps.add(scrap);
            // 양방향 관계 유지: ReviewScrap의 review 필드도 이 Review 인스턴스를 가리키도록 설정
            scrap.setReview(this);
        }
    }

    // 💡 테스트용 유저 Setter (운영 전 제거)
    public void setUser(User user) {
        this.user = user;
    }

    /**
     * 이 리뷰의 스크랩 목록에서 특정 스크랩을 제거합니다. 양방향 관계를 해제하기 위해 ReviewScrap의 review를 null로 설정합니다.
     *
     * @param scrap 제거할 ReviewScrap 객체
     */
    public void removeScrap(ReviewScrap scrap) {
        if (scrap != null && this.scraps.contains(scrap)) {
            this.scraps.remove(scrap);
            // 양방향 관계 해제
            scrap.setReview(null);
        }
    }

    // 💡 테스트용 가게 Setter (운영 전 제거)
    public void setStore(Store store) {
        this.store = store;
    }
}
