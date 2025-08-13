package com.global.constants;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public enum PagingConstants {
    DEFAULT_SIZE(18),
    MAX_SIZE(100),
    BUFFER(1);

    public final int value;
}
