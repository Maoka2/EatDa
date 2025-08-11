package com.domain.menu.service.impl;

import com.domain.menu.dto.redis.MenuPosterAssetGenerateMessage;
import com.domain.menu.dto.request.MenuPosterAssetCreateRequest;
import com.domain.menu.dto.response.MenuPosterAssetRequestResponse;
import com.domain.menu.entity.Menu;
import com.domain.menu.entity.MenuPoster;
import com.domain.menu.entity.MenuPosterAsset;
import com.domain.menu.redis.MenuPosterAssetRedisPublisher;
import com.domain.menu.repository.MenuPosterAssetRepository;
import com.domain.menu.repository.MenuPosterRepository;
import com.domain.menu.service.MenuPosterService;
import com.domain.menu.validator.MenuValidator;
import com.domain.store.entity.Store;
import com.domain.store.repository.StoreRepository;
import com.domain.user.entity.User;
import com.domain.user.repository.EaterRepository;
import com.global.constants.AssetType;
import com.global.constants.ErrorCode;
import com.global.exception.ApiException;
import com.global.filestorage.FileStorageService;
import com.global.redis.constants.RedisStreamKey;
import com.global.utils.AssetValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MenuPosterServiceImpl implements MenuPosterService {
    private static final String IMAGE_BASE_PATH = "menuPosters/";

    private final StoreRepository storeRepository;
    private final EaterRepository eaterRepository;
    private final MenuPosterRepository menuPosterRepository;
    private final MenuPosterAssetRepository menuPosterAssetRepository;
    private final MenuValidator menuValidator;
    private final MenuPosterAssetRedisPublisher menuPosterAssetRedisPublisher;
    private final FileStorageService fileStorageService;

    @Override
    public MenuPosterAssetRequestResponse requestMenuPosterAsset(MenuPosterAssetCreateRequest request, String eaterMail) {
        User eater = validateEater(eaterMail);
        Store store = validateStore(request.storeId());

        AssetValidator.validateImages(request.image(), ErrorCode.IMAGE_TOO_LARGE);

        List<Menu> menus = menuValidator.validateMenusBelongToStore(request.menuIds(), store);
        MenuPoster menuPoster = createPendingPoster(eater, store);
        MenuPosterAsset menuPosterAsset = createPendingAsset(menuPoster, request);

        boolean convertToWebp = shouldConvertToWebp(request.type());
        List<String> uploadedImageUrls = uploadImages(request.image(), IMAGE_BASE_PATH + eater.getEmail(), convertToWebp);
        MenuPosterAssetGenerateMessage message = MenuPosterAssetGenerateMessage.of(
                menuPosterAsset.getId(),
                request.type(),
                request.prompt(),
                store.getId(),
                eater.getId(),
                menus,
                uploadedImageUrls
        );
        menuPosterAssetRedisPublisher.publish(RedisStreamKey.MENU_POSTER, message);

        return MenuPosterAssetRequestResponse.from(menuPosterAsset);
    }

    private User validateEater(final String eaterEmail) {
        return eaterRepository.findByEmailAndDeletedFalse(eaterEmail)
                .orElseThrow(() -> {
                    log.warn("[MenuPosterService] 권한 없음 - eaterEmail: {}", eaterEmail);
                    return new ApiException(ErrorCode.FORBIDDEN);
                });
    }

    private Store validateStore(final Long storeId) {
        return storeRepository.findById(storeId)
                .orElseThrow(() -> {
                    log.warn("[MenuPosterService] 가게를 찾을 수 없음 - storeId: {}", storeId);
                    return new ApiException(ErrorCode.STORE_NOT_FOUND);
                });
    }

    private MenuPoster createPendingPoster(final User user, final Store store) {
        return menuPosterRepository.save(MenuPoster.createPending(user, store));
    }

    private MenuPosterAsset createPendingAsset(final MenuPoster menuPoster, final MenuPosterAssetCreateRequest request) {
        return menuPosterAssetRepository.save(MenuPosterAsset.createPending(menuPoster, AssetType.IMAGE, request.prompt()));
    }

    private List<String> uploadImages(final List<MultipartFile> images, final String relativeBase,
                                      final boolean convertToWebp) {
        return images.stream()
                .map(file -> fileStorageService.storeImage(
                        file,
                        relativeBase,
                        file.getOriginalFilename(),
                        convertToWebp
                ))
                .toList();
    }

    private boolean shouldConvertToWebp(AssetType type) {
        return type == AssetType.IMAGE;
    }
}
