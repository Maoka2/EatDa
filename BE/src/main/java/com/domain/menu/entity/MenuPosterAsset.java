package com.domain.menu.entity;

import com.global.constants.AssetType;
import com.global.constants.Status;
import com.global.entity.BaseAssetEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MenuPosterAsset extends BaseAssetEntity {

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_poster_id")
    private MenuPoster menuPoster;

    @Builder
    public MenuPosterAsset(final MenuPoster menuPoster, final AssetType type, final String path, final String prompt, final Status status) {
        this.menuPoster = menuPoster;
        this.type = type;
        this.path = path;
        this.prompt = prompt;
        this.status = status != null ? status : Status.PENDING;
    }

    public static MenuPosterAsset createPending(final MenuPoster menuPoster, final AssetType type, final String prompt) {
        return MenuPosterAsset.builder()
                .menuPoster(menuPoster)
                .type(type)
                .prompt(prompt)
                .status(Status.PENDING)
                .build();
    }

    public void registerMenuPoster(MenuPoster menuPoster) {
        this.menuPoster = menuPoster;
    }
}
