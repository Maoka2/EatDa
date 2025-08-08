package com.domain.store.controller;

import com.domain.store.entity.Store;
import com.domain.store.repository.StoreRepository;
import com.domain.user.entity.User;
import com.domain.user.repository.EaterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    // 테스트용, 삭제해야함
    private final StoreRepository storeRepository;
    private final EaterRepository eaterRepository;

    // 테스트용,  Store 생성
    @PostMapping("/test")
    public Long createTestStore(
            @RequestHeader(value = "X-User-Id", required = false) Long userId
    ) {
        // 실제 DB에서 User 조회
        User maker = eaterRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("해당 ID의 사용자가 존재하지 않습니다."));

        // Store 생성
        Store store = Store.builder()
                .name("테스트 가게")
                .address("서울시 강남구 어딘가")
                .latitude(37.1234)
                .longitude(127.5678)
                .licenseUrl("https://example.com/license.jpg")
                .maker(maker)
                .h3Index7(123L)
                .h3Index8(456L)
                .h3Index9(789L)
                .h3Index10(101112L)
                .build();

        Store saved = storeRepository.save(store);
        return saved.getId();
    }
}
