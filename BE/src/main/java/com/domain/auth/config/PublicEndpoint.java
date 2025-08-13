package com.domain.auth.config;

import java.util.Arrays;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public enum PublicEndpoint {

    // H2
    H2_CONSOLE("/h2-console/**"),

    // SWAGGER
    SWAGGER_UI("/swagger-ui/**"),
    SWAGGER_DOCS("/v3/api-docs/**"),
    SWAGGER_RESOURCES("/swagger-resources/**"),
    SWAGGER_WEBJARS("/webjars/**"),

    // ACUTUATOR
    ACTUATOR_HEALTH("/actuator/prometheus"),

    // USER
    EATER_CREATE("/api/eaters"),
    MAKER_CREATE("/api/makers"),
    EATER_CHECK_EMAIL("/api/eaters/check-email"),
    EATER_CHECK_NICKNAME("/api/eaters/check-nickname"),
    MAKER_CHECK_EMAIL("/api/makers/check-email"),

    // AUTH
    AUTH_SIGNIN("/api/auth/sign-in"),
    AUTH_SIGNOUT("/api/auth/sign-out"),
    AUTH_TOKEN("/api/auth/token"),

    THUMBNAIL("/api/reviews/thumbnail"),

    // REVIEW
    REVIEW_ASSET_CALLBACK("/api/reviews/assets/callback"),
    REVIEW_ASSET_POLLING("/api/reviews/asset/*/result"),

    // Menu Poster
    MENU_POSTER_CALLBACK("/api/menu-posters/assets/callback"),
    MENU_POSTER_POLLING("/api/menu-posters/asset/*/result"),

    // Event
    EVENT_ASSET_CALLBACK("/api/events/assets/callback"),
    EVENT_ASSET_POLLING("/api/events/asset/*/result");

    private final String path;

    public static boolean matches(final String requestPath) {
        return Arrays.stream(values())
                .anyMatch(endpoint -> endpoint.path.equals(requestPath));
    }

    public static String[] getAllPaths() {
        return Arrays.stream(values())
                .map(endpoint -> endpoint.path)
                .toArray(String[]::new);
    }
}
