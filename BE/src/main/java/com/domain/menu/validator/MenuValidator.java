package com.domain.menu.validator;

import com.domain.menu.entity.Menu;
import com.domain.menu.entity.MenuPoster;
import com.domain.menu.entity.MenuPosterAsset;
import com.domain.menu.repository.MenuRepository;
import com.domain.store.entity.Store;
import com.domain.user.entity.User;
import com.global.constants.AssetType;
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

    public void validateStoreOwnership(User maker, Store store) {
        if (!store.getMaker().getId().equals(maker.getId())) {
            log.warn("[MenuPosterService] 가게 소유자가 아님");
            throw new ApiException(ErrorCode.FORBIDDEN);
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

    public void validateForFinalization(MenuPosterAsset asset) {
        if (!asset.getStatus().isSuccess()) {
            throw new ApiException(ErrorCode.ASSET_NOT_SUCCESS, asset.getId());
        }

        if (asset.getType() == null) {
            throw new ApiException(ErrorCode.ASSET_TYPE_REQUIRED, asset.getId());
        }

        if (!asset.getType().equals(AssetType.IMAGE)) {
            throw new ApiException(ErrorCode.ASSET_TYPE_MISMATCH);
        }
    }

    public void validatePendingStatus(MenuPoster poster) {
        if (!poster.getStatus().isPending()) {
            throw new ApiException(ErrorCode.MENU_POSTER_NOT_PENDING, poster.getId());
        }
    }

    public void validateSuccessStatus(MenuPoster menuPoster) {
        if (!menuPoster.getStatus().isSuccess()) {
            log.warn("[MenuPosterService] 포스터가 아직 완성되지 않음 - menuPosterId: {}, status: {}",
                    menuPoster.getId(), menuPoster.getStatus());
            throw new ApiException(ErrorCode.MENU_POSTER_NOT_SUCCESS, menuPoster.getId());
        }
    }

    public void validateNotSent(MenuPoster menuPoster) {
        if (menuPoster.isSent()) {
            log.warn("[MenuValidator] 이미 전송된 포스터 - menuPosterId: {}", menuPoster.getId());
            throw new ApiException(ErrorCode.MENU_POSTER_ALREADY_SENT, menuPoster.getId());
        }
    }

    public void validateMenuPosterCount(List<Long> menuPosterIds) {
        if (menuPosterIds.size() > 5) {
            log.warn("[MenuValidator] 메뉴 포스터 개수 초과 - count: {}", menuPosterIds.size());
            throw new ApiException(ErrorCode.MENU_POSTER_EXCEED_LIMIT);
        }
    }

    public void validateMenuPostersExist(List<MenuPoster> menuPosters, List<Long> requestedIds) {
        if (menuPosters.size() != requestedIds.size()) {
            Set<Long> foundIds = menuPosters.stream()
                    .map(MenuPoster::getId)
                    .collect(Collectors.toSet());

            List<Long> notFoundIds = requestedIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .toList();

            log.warn("[MenuValidator] 존재하지 않는 메뉴 포스터 ID: {}", notFoundIds);
            throw new ApiException(ErrorCode.MENU_POSTER_NOT_FOUND, notFoundIds);
        }
    }

    public void validatePostersBelongToStore(List<MenuPoster> menuPosters, Long storeId) {
        List<MenuPoster> invalidPosters = menuPosters.stream()
                .filter(poster -> !poster.getStore().getId().equals(storeId))
                .toList();

        if (!invalidPosters.isEmpty()) {
            List<Long> invalidPosterIds = invalidPosters.stream()
                    .map(MenuPoster::getId)
                    .toList();
            log.warn("[MenuValidator] 다른 가게의 메뉴 포스터 - storeId: {}, invalidPosterIds: {}",
                    storeId, invalidPosterIds);
            throw new ApiException(ErrorCode.MENU_NOT_BELONG_TO_STORE, invalidPosterIds);
        }
    }

    public void validateAllPostersSent(List<MenuPoster> menuPosters) {
        List<MenuPoster> notSentPosters = menuPosters.stream()
                .filter(poster -> !poster.isSent())
                .toList();

        if (!notSentPosters.isEmpty()) {
            List<Long> notSentPosterIds = notSentPosters.stream()
                    .map(MenuPoster::getId)
                    .toList();
            log.warn("[MenuValidator] 전송되지 않은 메뉴 포스터 - posterIds: {}", notSentPosterIds);
            throw new ApiException(ErrorCode.MENU_POSTER_NOT_SENT, notSentPosterIds);
        }
    }
}
