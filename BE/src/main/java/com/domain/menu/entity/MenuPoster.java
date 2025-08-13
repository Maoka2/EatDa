package com.domain.menu.entity;

import com.domain.store.entity.Store;
import com.domain.user.entity.User;
import com.global.constants.Status;
import com.global.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MenuPoster extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    private String description;

    private boolean isSent;

    @Enumerated(EnumType.STRING)
    private Status status;

    @OneToMany(mappedBy = "menuPoster", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MenuPosterMenu> menuPosterMenus = new ArrayList<>();

    @Builder
    public MenuPoster(final User user, final Store store, String description, boolean isSent, Status status) {
        this.user = user;
        this.store = store;
        this.description = description;
        this.isSent = isSent;
        this.status = status != null ? status : Status.PENDING;
    }

    public static MenuPoster createPending(User user, Store store) {
        return MenuPoster.builder()
                .user(user)
                .store(store)
                .isSent(false)
                .status(Status.PENDING)
                .build();
    }

    public void updateDescription(String description) {
        this.description = description;
    }

    public void updateStatus(Status status) {
        this.status = status;
    }
    public void markAsSent() {
        this.isSent = true;
    }
}
