package com.domain.store.entity;

import com.domain.menu.entity.Menu;
import com.domain.user.entity.User;
import com.global.entity.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.util.List;
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

    @Column(columnDefinition = "TEXT")
    private String licenseUrl;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maker_id")
    private User maker;

    @OneToMany(mappedBy = "store", cascade = CascadeType.ALL)
    private List<Menu> menus;

    @NotNull
    @Column
    private Double latitude;

    @NotNull
    @Column
    private Double longitude;

    // H3 인덱스: 해상도 7 ~ 10까지 별도 컬럼
    @Column(name = "h3_index_7")
    private Long h3Index7;

    @Column(name = "h3_index_8")
    private Long h3Index8;

    @Column(name = "h3_index_9")
    private Long h3Index9;

    @Column(name = "h3_index_10")
    private Long h3Index10;

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

    public void addMaker(final User maker) {
        this.maker = maker;
    }
}
