package com.domain.user.entity;

import com.domain.user.constants.Provider;
import com.domain.user.constants.Role;
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
    private String password;

    @NotNull
    @Column(length = 50, unique = true)
    private String nickName;

    @NotNull
    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private Provider provider;

    @Column(length = 100)
    private String providerId;

    // 연관관계 매핑 - 사용자 태그 목록
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserFoodTag> userFoodTags;

    @Builder
    public User(String email, String password, String nickname, Role role, Provider provider, String providerId,
                List<UserFoodTag> userFoodTags) {
        this.email = email;
        this.password = password;
        this.nickname = nickname;
        this.role = role;
        this.provider = provider;
        this.providerId = providerId;
        this.userFoodTags = userFoodTags;
    }
}
