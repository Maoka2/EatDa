package com.global.constants;

import lombok.Getter;

@Getter
public enum Messages {
    INVALID_INPUT("잘못된 입력입니다.");

    private final String message;

    Messages(String message) {
        this.message = message;
    }
}
