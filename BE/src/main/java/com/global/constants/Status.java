package com.global.constants;

import static com.global.constants.ErrorCode.INVALID_STATUS;

import com.global.exception.ApiException;

public enum Status {
    PENDING,
    SUCCESS,
    FAIL;

    public static Status fromString(String value) {
        try {
            return Status.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new ApiException(INVALID_STATUS);
        }
    }

    public boolean isPending() {
        return this == PENDING;
    }

    public boolean isSuccess() {
        return this == SUCCESS;
    }

    public boolean isFail() {
        return this == FAIL;
    }
}
