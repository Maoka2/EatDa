package com.domain.event.entity;

import com.domain.store.entity.Store;
import com.global.constants.Status;
import com.global.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Event extends BaseEntity {

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
    LocalDate startDate;

    @NotNull
    LocalDate endDate;

    @NotNull
    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;

    @Builder
    public Event(final Store store, final LocalDate startDate, final LocalDate endDate, Status status) {
        this.store = store;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status != null ? status : Status.PENDING;
    }

    public static Event createPending(Store store, LocalDate startDate, LocalDate endDate) {
        return Event.builder()
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
