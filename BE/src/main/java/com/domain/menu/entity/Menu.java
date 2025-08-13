package com.domain.menu.entity;

import com.domain.store.entity.Store;
import com.global.annotation.ExcludeFromLogging;
import com.global.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "menu")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Menu extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(length = 100)
    private String name;

    @NotNull
    private Integer price;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ExcludeFromLogging
    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @OneToMany(mappedBy = "menu")
    private List<MenuPosterMenu> menuPosterMenus = new ArrayList<>();

    @Builder
    public Menu(final String name, final Integer price, final String description, final String imageUrl, Store store) {
        this.name = name;
        this.price = price;
        this.description = description;
        this.imageUrl = imageUrl;
        this.store = store;
    }
}
