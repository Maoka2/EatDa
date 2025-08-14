package com.domain.store.controller;

import com.domain.store.dto.request.StoreNearbyRequest;
import com.domain.store.dto.response.StoreNearbyResponse;
import com.domain.store.entity.Store;
import com.domain.store.repository.StoreRepository;
import com.domain.store.service.StoreService;
import com.domain.user.entity.User;
import com.domain.user.repository.EaterRepository;
import com.global.constants.SuccessCode;
import com.global.dto.response.ApiResponseFactory;
import com.global.dto.response.BaseResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreRepository storeRepository;
    private final EaterRepository eaterRepository;
    private final StoreService storeService;

    // JWT의 principal(email) 기반으로 사용자 조회 후 Store 생성 (테스트용, EATER, MAKER 다 가능하게 했음)
    @PreAuthorize("hasAnyAuthority('EATER','MAKER')")
    @PostMapping("/test")
    public Long createTestStore(final Authentication authentication) {

        String email = (String) authentication.getPrincipal();

        User eater = eaterRepository.findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 이메일의 사용자가 존재하지 않습니다."));

        Store store = Store.builder()
                .name("테스트 가게")
                .address("서울시 강남구 어딘가")
                .latitude(37.1234)
                .longitude(127.5678)
                .licenseUrl(
                        "https://i13a609.p.ssafy.io/eatda/test/data/images/reviews/gonaging@example.com/3039f163e98d44e4b92ca8f30141cbbd.webp")
                .maker(eater)
                .h3Index7(123L)
                .h3Index8(456L)
                .h3Index9(789L)
                .h3Index10(101112L)
                .build();

        return storeRepository.save(store).getId();
    }

    @GetMapping("/nearby")
    public ResponseEntity<BaseResponse> getNearbyStores(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(required = false) Integer distance,
            @AuthenticationPrincipal final String email
    ) {
        // 로그 추가
        log.info("Received params - lat: {}, lon: {}, dist: {}", latitude, longitude, distance);

        StoreNearbyRequest request = new StoreNearbyRequest(latitude, longitude, distance);
        StoreNearbyResponse response = storeService.getNearbyStores(request, email);
        return ApiResponseFactory.success(SuccessCode.NEARBY_STORES_FOUND, response);
    }
}
