package com.domain.event.entity;

import com.domain.store.entity.Store;
import com.global.constants.Status;
import com.global.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Event extends BaseEntity {

    @NotNull
    LocalDate startDate;

    @NotNull
    LocalDate endDate;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String title;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;

    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    @Builder
    public Event(String title, final Store store, final LocalDate startDate, final LocalDate endDate, Status status) {
        this.title = title;
        this.store = store;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status != null ? status : Status.PENDING;
    }

    public static Event createPending(String title, Store store, LocalDate startDate, LocalDate endDate) {
        return Event.builder()
                .title(title)
                .store(store)
                .startDate(startDate)
                .endDate(endDate)
                .status(Status.PENDING)
                .build();
    }

    public void updateStatus(final Status status) {
        this.status = status;
    }

    public void updateDescription(final String description) {
        this.description = description;
    }

    // 테스트용
    public void setTitle(final String title) {
        this.title = title;
    }
}
