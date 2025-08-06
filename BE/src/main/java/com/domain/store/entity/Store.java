package com.domain.store.entity;

import com.domain.user.entity.User;
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
@Table(name = "store")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Store extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(length = 100)
    private String name;

    @NotNull
    @Column(length = 255)
    private String address;

    @NotNull
    @Column
    private Double latitude;

    @NotNull
    @Column
    private Double longitude;

    @NotNull
    @Column(columnDefinition = "TEXT")
    private String licenseUrl;

    @Column
    private Long h3Index7;

    @Column
    private Long h3Index8;

    @Column
    private Long h3Index9;

    @Column
    private Long h3Index10;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maker_id", nullable = false)
    private User maker;

    @Builder
    public Store(final String name, final String address, final Double latitude, final Double longitude,
                 final String licenseUrl, final User maker, final Long h3Index7, final Long h3Index8,
                 final Long h3Index9, final Long h3Index10) {
        this.name = name;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.licenseUrl = licenseUrl;
        this.maker = maker;
        this.h3Index7 = h3Index7;
        this.h3Index8 = h3Index8;
        this.h3Index9 = h3Index9;
        this.h3Index10 = h3Index10;
    }
}
