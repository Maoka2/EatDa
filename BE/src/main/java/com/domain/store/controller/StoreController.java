package com.domain.store.controller;

import com.domain.store.entity.Store;
import com.domain.store.repository.StoreRepository;
import com.domain.user.entity.User;
import com.domain.user.repository.EaterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
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
    public Long createTestStore() {
        // 임시 maker (User가 실제 DB에 있는 경우에만 동작)
        User maker = User.builder().build(); // ID만 있는 더미 객체

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
                .maker(eaterRepository.findById(1L).get())
                .build();

        Store saved = storeRepository.save(store);
        return saved.getId();
    }
}
