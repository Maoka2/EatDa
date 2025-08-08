package com.domain.review.constants;

import java.util.Set;

/**
 * 리뷰 도메인 관련 상수 정의
 */
public final class ReviewConstants {

    // 인스턴스화 방지
    private ReviewConstants() {
        throw new AssertionError("Constants class should not be instantiated");
    }

    // 검색 가능한 거리 목록 (미터 단위)
    public static final Set<Integer> SEARCH_DISTANCES = Set.of(300, 500, 700, 850, 1000, 2000);

    // 서울 지역 위경도 범위
    public static final Double MAX_LATITUDE = 37.80;
    public static final Double MIN_LATITUDE = 37.40;
    public static final Double MAX_LONGITUDE = 127.30;
    public static final Double MIN_LONGITUDE = 126.60;

    // 페이징 관련
    public static final int DEFAULT_PAGE_SIZE = 20;
    public static final int MAX_PAGE_SIZE = 100;
    public static final int PAGINATION_BUFFER = 1; // hasNext 판단을 위한 추가 조회 개수

    // 캐시 관련
    public static final int CACHE_TTL_HOURS = 6;
}
