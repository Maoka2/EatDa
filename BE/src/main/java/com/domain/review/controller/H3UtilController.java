package com.domain.review.controller;

import com.domain.review.entity.Store;
import com.domain.review.repository.StoreRepository;
import com.domain.review.service.H3Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/test/h3-util")
@RequiredArgsConstructor
@Slf4j
public class H3UtilController {

    private final H3Service h3Service;
    private final StoreRepository storeRepository;

    /**
     * 좌표를 입력하면 H3 인덱스를 계산해주는 API
     */
    @GetMapping("/calculate")
    public Map<String, Object> calculateH3Index(
            @RequestParam double lat,
            @RequestParam double lon) {

        return Map.of(
                "coordinates", Map.of("lat", lat, "lon", lon),
                "h3_index_7", h3Service.encode(lat, lon, 7),
                "h3_index_8", h3Service.encode(lat, lon, 8),
                "h3_index_9", h3Service.encode(lat, lon, 9),
                "h3_index_10", h3Service.encode(lat, lon, 10)
        );
    }

    /**
     * H3 인덱스가 없는 Store들의 H3 인덱스를 일괄 업데이트
     */
    @PostMapping("/update-stores")
    public String updateStoreH3Indexes() {
        List<Store> stores = storeRepository.findAll();
        log.info("stores: {}", stores.size());
        int updated = 0;

        for (Store store : stores) {
            if (store.getH3Index7() == null) {
                store.setH3Index7(h3Service.encode(store.getLatitude(), store.getLongitude(), 7));
                store.setH3Index8(h3Service.encode(store.getLatitude(), store.getLongitude(), 8));
                store.setH3Index9(h3Service.encode(store.getLatitude(), store.getLongitude(), 9));
                store.setH3Index10(h3Service.encode(store.getLatitude(), store.getLongitude(), 10));
                storeRepository.save(store);
                updated++;
            }
        }

        return String.format("Updated H3 indexes for %d stores", updated);
    }
}
