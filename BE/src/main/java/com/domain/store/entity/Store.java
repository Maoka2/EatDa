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

    @Builder
    public Store(final String name, final String address, final String licenseUrl, final User maker) {
        this.name = name;
        this.address = address;
        this.licenseUrl = licenseUrl;
        this.maker = maker;
    }
}
