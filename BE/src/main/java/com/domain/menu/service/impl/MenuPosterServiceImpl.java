package com.domain.menu.service.impl;

import com.domain.menu.dto.redis.MenuPosterAssetGenerateMessage;
import com.domain.menu.dto.request.AdoptMenuPostersRequest;
import com.domain.menu.dto.request.MenuPosterAssetCreateRequest;
import com.domain.menu.dto.request.MenuPosterFinalizeRequest;
import com.domain.menu.dto.response.AdoptMenuPostersResponse;
import com.domain.menu.dto.response.MenuPosterAssetRequestResponse;
import com.domain.menu.dto.response.MenuPosterFinalizeResponse;
import com.domain.menu.entity.AdoptedMenuPoster;
import com.domain.menu.entity.Menu;
import com.domain.menu.entity.MenuPoster;
import com.domain.menu.entity.MenuPosterAsset;
import com.domain.menu.redis.MenuPosterAssetRedisPublisher;
import com.domain.menu.repository.AdoptedMenuPosterRepository;
import com.domain.menu.repository.MenuPosterAssetRepository;
import com.domain.menu.repository.MenuPosterRepository;
import com.domain.menu.service.MenuPosterService;
import com.domain.menu.validator.MenuValidator;
import com.domain.store.entity.Store;
import com.domain.store.repository.StoreRepository;
import com.domain.user.entity.User;
import com.domain.user.repository.EaterRepository;
import com.domain.user.repository.MakerRepository;
import com.global.constants.AssetType;
import com.global.constants.ErrorCode;
import com.global.constants.Status;
import com.global.dto.request.AssetCallbackRequest;
import com.global.dto.response.AssetResultResponse;
import com.global.entity.BaseEntity;
import com.global.exception.ApiException;
import com.global.filestorage.FileStorageService;
import com.global.redis.constants.RedisStreamKey;
import com.global.utils.AssetValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MenuPosterServiceImpl implements MenuPosterService {
    private static final String IMAGE_BASE_PATH = "menuPosters/";

    private final StoreRepository storeRepository;
    private final EaterRepository eaterRepository;
    private final MakerRepository makerRepository;
    private final MenuPosterRepository menuPosterRepository;
    private final MenuPosterAssetRepository menuPosterAssetRepository;
    private final AdoptedMenuPosterRepository adoptedMenuPosterRepository;
    private final MenuValidator menuValidator;
    private final MenuPosterAssetRedisPublisher menuPosterAssetRedisPublisher;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional
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

    @Override
    @Transactional
    public void handleMenuPosterAssetCallback(AssetCallbackRequest<?> request) {
        MenuPosterAsset asset = menuPosterAssetRepository.findById(request.assetId())
                .orElseThrow(() -> new ApiException(ErrorCode.ASSET_NOT_FOUND));

        AssetValidator.validateCallbackRequest(asset, request);
        Status status = Status.fromString(request.result());
        asset.processCallback(status, request.assetUrl());
    }

    @Override
    @Transactional
    public AssetResultResponse getMenuPosterAssetStatus(Long assetId, String eaterMail) {
        User eater = validateEater(eaterMail);
        MenuPosterAsset asset = validateAsset(assetId);

        menuValidator.validatePosterOwnership(eater, asset);

        return switch (asset.getStatus()) {
            case SUCCESS -> new AssetResultResponse(asset.getType(), asset.getPath());
            case PENDING -> new AssetResultResponse(asset.getType(), "");
            case FAIL -> throw new ApiException(ErrorCode.ASSET_URL_REQUIRED, assetId);
        };
    }

    @Override
    @Transactional
    public MenuPosterFinalizeResponse finalizeMenuPoster(MenuPosterFinalizeRequest request) {
        MenuPosterAsset asset = validateAsset(request.menuPosterAssetId());
        menuValidator.validateForFinalization(asset);

        MenuPoster menuPoster = validateMenuPoster(request.menuPosterId());
        menuValidator.validatePendingStatus(menuPoster);

        menuPoster.updateDescription(request.description());
        menuPoster.updateStatus(Status.SUCCESS);
        asset.registerMenuPoster(menuPoster);

        return MenuPosterFinalizeResponse.from(menuPoster);
    }

    @Override
    @Transactional
    public void sendMenuPosterToMaker(Long menuPosterId, String eaterEmail) {
        User eater = validateEater(eaterEmail);

        MenuPoster menuPoster = validateMenuPoster(menuPosterId);
        menuValidator.validatePosterOwnership(eater, menuPoster);
        menuValidator.validateNotSent(menuPoster);
        menuValidator.validateSuccessStatus(menuPoster);

        menuPoster.markAsSent();
    }

    @Override
    @Transactional
    public AdoptMenuPostersResponse adoptMenuPosters(AdoptMenuPostersRequest request, String makerEmail) {
        User maker = validateMater(makerEmail);
        Store store = validateStore(request.storeId());

        menuValidator.validateStoreOwnership(maker, store);
        menuValidator.validateMenuPosterCount(request.menuPosterIds());

        List<MenuPoster> menuPosters = menuPosterRepository.findAllById(request.menuPosterIds());
        menuValidator.validateMenuPostersExist(menuPosters, request.menuPosterIds());
        menuValidator.validateAllPostersSent(menuPosters);
        menuValidator.validatePostersBelongToStore(menuPosters, request.storeId());

        List<AdoptedMenuPoster> existingAdopted = adoptedMenuPosterRepository.findByStoreIdAndDeletedFalse(request.storeId());
        if (!existingAdopted.isEmpty()) {
            existingAdopted.forEach(BaseEntity::delete);
            adoptedMenuPosterRepository.saveAll(existingAdopted);
        }

        List<AdoptedMenuPoster> newAdopted = menuPosters.stream()
                .map(poster -> AdoptedMenuPoster.builder()
                        .store(store)
                        .menuPoster(poster)
                        .build()
                ).toList();
        adoptedMenuPosterRepository.saveAll(newAdopted);
        return AdoptMenuPostersResponse.of(request.storeId(), request.menuPosterIds());
    }

    private User validateEater(final String eaterEmail) {
        return eaterRepository.findByEmailAndDeletedFalse(eaterEmail)
                .orElseThrow(() -> {
                    log.warn("[MenuPosterService] 권한 없음 - eaterEmail: {}", eaterEmail);
                    return new ApiException(ErrorCode.FORBIDDEN);
                });
    }

    private User validateMater(final String makerEmail) {
        return makerRepository.findByEmailAndDeletedFalse(makerEmail)
                .orElseThrow(() -> {
                    log.warn("[MenuPosterService] 권한 없음 - makerEmail: {}", makerEmail);
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

    private MenuPoster validateMenuPoster(final Long menuPosterId) {
        return menuPosterRepository.findById(menuPosterId)
                .orElseThrow(() -> {
                    log.warn("[MenuPosterService] 메뉴 포스터를 찾을 수 없음 - menuPosterId: {}", menuPosterId);
                    return new ApiException(ErrorCode.MENU_POSTER_NOT_FOUND, menuPosterId);
                });
    }

    private MenuPosterAsset validateAsset(final Long assetId) {
        return menuPosterAssetRepository.findById(assetId)
                .orElseThrow(() -> {
                    log.warn("[MenuPosterService] 해당 에셋을 찾을 수 없음 - assetId: {}", assetId);
                    return new ApiException(ErrorCode.ASSET_NOT_FOUND, assetId);
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
