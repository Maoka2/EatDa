package com.global.constants;

import lombok.Getter;

import java.util.Optional;

@Getter
public enum SearchDistance {
    DISTANCE_300(300),
    DISTANCE_500(500),  // 기본값
    DISTANCE_700(700),
    DISTANCE_1000(1000),
    DISTANCE_2000(2000);

    private final int meters;

    SearchDistance(int meters) {
        this.meters = meters;
    }

    // 기본값 가져오기
    public static SearchDistance getDefault() {
        return DISTANCE_500;
    }


    public static Optional<SearchDistance> find(int meters) {
        for (SearchDistance distance : values()) {
            if (distance.meters == meters) {
                return Optional.of(distance);
            }
        }
        return Optional.empty();
    }

    public static boolean isValid(int meters) {
        for (SearchDistance distance : values()) {
            if (distance.meters != meters) {
                return false;
            }
        }
        return true;
    }
}
