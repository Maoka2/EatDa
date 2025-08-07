package com.domain.user.entity;

import com.domain.store.entity.Store;
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
}
