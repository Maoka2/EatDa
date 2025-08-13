package com.domain.menu.entity;

import com.domain.store.entity.Store;
import com.global.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AdoptedMenuPoster extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_poster_id")
    private MenuPoster menuPoster;

    private LocalDateTime adoptedAt;

    @Builder
    public AdoptedMenuPoster(final Store store,  final MenuPoster menuPoster) {
        this.store = store;
        this.menuPoster = menuPoster;
        this.adoptedAt = LocalDateTime.now();
    }
}
