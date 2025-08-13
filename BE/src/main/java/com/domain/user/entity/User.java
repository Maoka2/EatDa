package com.domain.user.entity;

import com.domain.review.entity.ReviewScrap;
import com.domain.store.entity.Store;
import com.domain.user.constants.Provider;
import com.domain.user.constants.Role;
import com.global.annotation.Sensitive;
import com.global.entity.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(length = 255, unique = true)
    private String email;

    @NotNull
    @Column(length = 255)
    @Sensitive
    private String password;

    @NotNull
    @Column(length = 50)
    private String nickname;

    @NotNull
    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private Provider provider;

    @Column(length = 100)
    private String providerId;

    @OneToMany(mappedBy = "maker", cascade = CascadeType.ALL)
    private List<Store> stores;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReviewScrap> scraps;

    @Builder
    public User(final String email, final String password, final String nickname, final Role role,
                final Provider provider, final String providerId) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.role = role;
        this.provider = provider;
        this.providerId = providerId;
    }

    /**
     * 이 사용자의 스크랩 목록에 새로운 스크랩을 추가합니다. 양방향 관계를 유지하기 위해 ReviewScrap의 user도 설정합니다.
     *
     * @param scrap 추가할 ReviewScrap 객체
     */
    public void addScrap(ReviewScrap scrap) {
        // null 체크와 중복 방지
        if (scrap != null && !this.scraps.contains(scrap)) {
            this.scraps.add(scrap);
            // 양방향 관계 유지: ReviewScrap의 user 필드도 이 User 인스턴스를 가리키도록 설정
            scrap.setUser(this);
        }
    }

    /**
     * 이 사용자의 스크랩 목록에서 특정 스크랩을 제거합니다. 양방향 관계를 해제하기 위해 ReviewScrap의 user를 null로 설정합니다.
     *
     * @param scrap 제거할 ReviewScrap 객체
     */
    public void removeScrap(ReviewScrap scrap) {
        // null 체크와 존재 여부 확인
        if (scrap != null && this.scraps.contains(scrap)) {
            this.scraps.remove(scrap);
            // 양방향 관계 해제: ReviewScrap의 user 필드를 null로 설정
            // orphanRemoval = true 이므로, 이 작업은 DB에서 해당 ReviewScrap을 삭제하는 트리거가 됩니다.
            scrap.setUser(null);
        }
    }

    /**
     * 이 사용자의 모든 스크랩을 제거합니다. 각각의 removeScrap 메서드를 호출하여 양방향 관계를 올바르게 해제합니다.
     */
    public void clearScraps() {
        new ArrayList<>(this.scraps).forEach(this::removeScrap);
    }

    public void addStore(Store store) {
        if (this.stores == null) {
            this.stores = new ArrayList<>(); // 안전장치
        }
        this.stores.add(store);                 // 메모리상 컬렉션 동기화
        store.addMaker(this);                   // 연관관계의 주인 측 세팅
    }
}
