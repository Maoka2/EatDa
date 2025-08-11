package com.domain.menu.validator;

import com.domain.menu.entity.Menu;
import com.domain.menu.entity.MenuPoster;
import com.domain.menu.entity.MenuPosterAsset;
import com.domain.menu.repository.MenuRepository;
import com.domain.store.entity.Store;
import com.domain.user.entity.User;
import com.global.constants.ErrorCode;
import com.global.exception.ApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class MenuValidator {

    private final MenuRepository menuRepository;

    public List<Menu> validateMenusBelongToStore(final List<Long> menuIds, final Store store) {
        validateMenuIds(menuIds);

        List<Menu> menus = findExistingMenus(menuIds);

        validateStoreOwnership(menus, store);

        log.debug("[MenuValidator] {} 개의 메뉴가 가게 ID {}에 대해 검증됨",
                menus.size(), store.getId());
        return menus;
    }

    private void validateMenuIds(List<Long> menuIds) {
        if (menuIds == null || menuIds.isEmpty()) {
            log.warn("[MenuValidator] 메뉴 ID 목록이 비어있음");
            throw new ApiException(ErrorCode.MENU_IDS_REQUIRED);
        }
    }

    private List<Menu> findExistingMenus(List<Long> menuIds) {
        List<Menu> menus = menuRepository.findAllById(menuIds);

        // 1. 조회된 메뉴 ID를 Set으로 변환 (내부 효율성 위해)
        Set<Long> foundIds = menus.stream()
                .map(Menu::getId)
                .collect(Collectors.toSet());

        // 2. 존재하지 않는 메뉴 ID 직접 필터링
        List<Long> notFoundIds = menuIds.stream()
                .filter(id -> !foundIds.contains(id))
                .toList();

        // 3. 존재하지 않는 메뉴가 있을 경우 예외 발생
        if (!notFoundIds.isEmpty()) {
            log.warn("[MenuValidator] 존재하지 않는 메뉴 ID: {}", notFoundIds);
            throw new ApiException(ErrorCode.MENU_NOT_FOUND, notFoundIds);
        }

        return menus;
    }

    private void validateStoreOwnership(List<Menu> menus, Store store) {
        List<Menu> invalidMenus = menus.stream()
                .filter(menu -> !menu.getStore().getId().equals(store.getId()))
                .toList();

        if (!invalidMenus.isEmpty()) {
            List<Long> invalidMenuIds = invalidMenus.stream()
                    .map(Menu::getId)
                    .toList();

            log.warn("[MenuValidator] 가게 ID {}에 속하지 않는 메뉴 ID: {}",
                    store.getId(), invalidMenuIds);
            throw new ApiException(ErrorCode.MENU_NOT_BELONG_TO_STORE, invalidMenuIds);
        }
    }

    public void validatePosterOwnership(User eater, MenuPoster poster) {
        if (!poster.getUser().getId().equals(eater.getId())) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
    }

    public void validatePosterOwnership(User eater, MenuPosterAsset asset) {
        validatePosterOwnership(eater, asset.getMenuPoster());
    }
}
