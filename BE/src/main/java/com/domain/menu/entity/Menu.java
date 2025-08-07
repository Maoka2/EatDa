package com.domain.menu.entity;

import com.domain.store.entity.Store;
import com.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

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

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    @Builder
    public Menu(final String name, final Integer price, final String description, final String imageUrl, Store store) {
        this.name = name;
        this.price = price;
        this.description = description;
        this.imageUrl = imageUrl;
        this.store = store;
    }
}
