package com.domain.event.entity;

import com.global.constants.AssetType;
import com.global.constants.Status;
import com.global.entity.BaseAssetEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EventAsset extends BaseAssetEntity {

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    @Builder
    public EventAsset(final Event event, final AssetType type, final String path, final String prompt, final Status status) {
        this.event = event;
        this.type = type;
        this.path = path;
        this.prompt = prompt;
        this.status = status != null ? status : Status.PENDING;
    }

    public static EventAsset createPending(Event event, AssetType type, String prompt) {
        return EventAsset.builder()
                .event(event)
                .type(type)
                .prompt(prompt)
                .status(Status.PENDING)
                .build();
    }

    public void registerEvent(final Event event) {
        this.event = event;
    }
}
