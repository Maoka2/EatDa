package com.a609.eatda.domain.menu.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.domain.menu.dto.request.AdoptMenuPostersRequest;
import com.domain.menu.dto.request.MenuPosterAssetCreateRequest;
import com.domain.menu.dto.response.AdoptMenuPostersResponse;
import com.domain.menu.entity.Menu;
import com.domain.menu.entity.MenuPoster;
import com.domain.menu.entity.MenuPosterAsset;
import com.domain.menu.redis.MenuPosterAssetRedisPublisher;
import com.domain.menu.repository.AdoptedMenuPosterRepository;
import com.domain.menu.repository.MenuPosterAssetRepository;
import com.domain.menu.repository.MenuPosterRepository;
import com.domain.menu.service.impl.MenuPosterServiceImpl;
import com.domain.menu.validator.MenuValidator;
import com.domain.store.entity.Store;
import com.domain.store.repository.StoreRepository;
import com.domain.user.constants.Provider;
import com.domain.user.constants.Role;
import com.domain.user.entity.User;
import com.domain.user.repository.EaterRepository;
import com.domain.user.repository.MakerRepository;
import com.global.constants.AssetType;
import com.global.constants.ErrorCode;
import com.global.constants.Status;
import com.global.dto.request.AssetCallbackRequest;
import com.global.dto.response.AssetResultResponse;
import com.global.exception.ApiException;
import com.global.filestorage.FileStorageService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

@ExtendWith(MockitoExtension.class)
@DisplayName("MenuPosterServiceImpl 테스트")
class MenuPosterServiceImplTest {

    @InjectMocks
    private MenuPosterServiceImpl menuPosterService;

    @Mock
    private StoreRepository storeRepository;
    @Mock
    private EaterRepository eaterRepository;
    @Mock
    private MakerRepository makerRepository;
    @Mock
    private MenuPosterRepository menuPosterRepository;
    @Mock
    private MenuPosterAssetRepository menuPosterAssetRepository;
    @Mock
    private AdoptedMenuPosterRepository adoptedMenuPosterRepository;
    @Mock
    private MenuValidator menuValidator;
    @Mock
    private MenuPosterAssetRedisPublisher menuPosterAssetRedisPublisher;
    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private User testEater;
    @Mock
    private User testMaker;
    @Mock
    private Store testStore;
    @Mock
    private Menu testMenu;
    @Mock
    private MenuPoster testMenuPoster;
    @Mock
    private MenuPosterAsset testMenuPosterAsset;

    @BeforeEach
    void setUp() {
        testEater = User.builder()
                .email("eater@test.com")
                .password("password123")
                .nickname("testEater")
                .role(Role.EATER)
                .provider(Provider.LOCAL)
                .build();

        testMaker = User.builder()
                .email("maker@test.com")
                .password("password123")
                .nickname("testMaker")
                .role(Role.MAKER)
                .provider(Provider.LOCAL)
                .build();

        testStore = Store.builder()
                .name("테스트 매장")
                .address("서울시 강남구 테스트로 123")
                .latitude(37.4979)
                .longitude(127.0276)
                .licenseUrl("http://test-license.com")
                .maker(testMaker)
                .build();

        testMenu = Menu.builder()
                .name("테스트 메뉴")
                .price(15000)
                .description("맛있는 테스트 메뉴")
                .imageUrl("http://test-menu-image.com")
                .store(testStore)
                .build();

        testMenuPoster = MenuPoster.builder()
                .user(testEater)
                .store(testStore)
                .description("테스트 메뉴 포스터 설명")
                .isSent(false)
                .status(Status.PENDING)
                .build();

        testMenuPosterAsset = MenuPosterAsset.builder()
                .menuPoster(testMenuPoster)
                .type(AssetType.IMAGE)
                .path(null)  // 초기에는 null
                .prompt("테스트 프롬프트")
                .status(Status.PENDING)
                .build();
    }

    @Nested
    @DisplayName("requestMenuPosterAsset 테스트")
    class RequestMenuPosterAssetTest {

//        @Test
//        @DisplayName("성공 - 메뉴 포스터 에셋 생성 요청")
//        void requestMenuPosterAsset_Success() {
//            // Given
//            String eaterEmail = "eater@test.com";
//            Long storeId = 1L;
//            List<Long> menuIds = List.of(1L);
//            MultipartFile mockFile = mock(MultipartFile.class);
//            List<MultipartFile> images = List.of(mockFile);
//
//            MenuPosterAssetCreateRequest request = new MenuPosterAssetCreateRequest(
//                    storeId,
//                    AssetType.IMAGE,
//                    menuIds,
//                    "테스트 프롬프트",
//                    images
//            );
//
//            when(eaterRepository.findByEmailAndDeletedFalse(eaterEmail))
//                    .thenReturn(Optional.of(testEater));
//            when(storeRepository.findById(storeId))
//                    .thenReturn(Optional.of(testStore));
//            when(menuValidator.validateMenusBelongToStore(menuIds, testStore))
//                    .thenReturn(List.of(testMenu));
//            when(menuPosterRepository.save(any(MenuPoster.class)))
//                    .thenReturn(testMenuPoster);
//            when(menuPosterAssetRepository.save(any(MenuPosterAsset.class)))
//                    .thenReturn(testMenuPosterAsset);
//            when(fileStorageService.storeImage(any(), any(), any(), eq(true)))
//                    .thenReturn("uploaded-image-url");
//            doNothing().when(menuPosterAssetRedisPublisher).publish(any(), any());
//
//            // When
//            MenuPosterAssetRequestResponse response = menuPosterService
//                    .requestMenuPosterAsset(request, eaterEmail);
//
//            // Then
//            assertThat(response).isNotNull();
//            verify(eaterRepository).findByEmailAndDeletedFalse(eaterEmail);
//            verify(storeRepository).findById(storeId);
//            verify(menuValidator).validateMenusBelongToStore(menuIds, testStore);
//            verify(menuPosterRepository).save(any(MenuPoster.class));
//            verify(menuPosterAssetRepository).save(any(MenuPosterAsset.class));
//            verify(fileStorageService).storeImage(any(), any(), any(), eq(true));
//            verify(menuPosterAssetRedisPublisher).publish(any(), any());
//        }

        @Test
        @DisplayName("실패 - 존재하지 않는 사용자")
        void requestMenuPosterAsset_EaterNotFound() {
            // Given
            String eaterEmail = "nonexistent@test.com";
            MenuPosterAssetCreateRequest request = new MenuPosterAssetCreateRequest(
                    1L, "IMAGE", List.of(1L), "프롬프트", List.of(mock(MultipartFile.class))
            );

            when(eaterRepository.findByEmailAndDeletedFalse(eaterEmail))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> menuPosterService.requestMenuPosterAsset(request, eaterEmail))
                    .isInstanceOf(ApiException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 매장")
        void requestMenuPosterAsset_StoreNotFound() {
            // Given
            String eaterEmail = "eater@test.com";
            Long nonExistentStoreId = 999L;
            MenuPosterAssetCreateRequest request = new MenuPosterAssetCreateRequest(
                    nonExistentStoreId, "IMAGE", List.of(1L), "프롬프트", List.of(mock(MultipartFile.class))
            );

            when(eaterRepository.findByEmailAndDeletedFalse(eaterEmail))
                    .thenReturn(Optional.of(testEater));
            when(storeRepository.findById(nonExistentStoreId))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> menuPosterService.requestMenuPosterAsset(request, eaterEmail))
                    .isInstanceOf(ApiException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.STORE_NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("handleMenuPosterAssetCallback 테스트")
    class HandleMenuPosterAssetCallbackTest {

//        @Test
//        @DisplayName("성공 - 콜백 처리")
//        void handleMenuPosterAssetCallback_Success() {
//            // Given
//            Long assetId = 1L;
//            AssetCallbackRequest<AssetType> request = new AssetCallbackRequest<>(
//                    assetId,
//                    "SUCCESS",
//                    "asset-url",
//                    AssetType.IMAGE
//            );
//
//            when(menuPosterAssetRepository.findById(assetId))
//                    .thenReturn(Optional.of(testMenuPosterAsset));
//            doNothing().when(testMenuPosterAsset).processCallback(any(Status.class), any(String.class));
//
//            // When
//            menuPosterService.handleMenuPosterAssetCallback(request);
//
//            // Then
//            verify(menuPosterAssetRepository).findById(assetId);
//        }

        @Test
        @DisplayName("실패 - 존재하지 않는 에셋")
        void handleMenuPosterAssetCallback_AssetNotFound() {
            // Given
            Long nonExistentAssetId = 999L;
            AssetCallbackRequest<AssetType> request = new AssetCallbackRequest<>(
                    nonExistentAssetId,
                    "SUCCESS",
                    "asset-url",
                    AssetType.IMAGE
            );

            when(menuPosterAssetRepository.findById(nonExistentAssetId))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> menuPosterService.handleMenuPosterAssetCallback(request))
                    .isInstanceOf(ApiException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ASSET_NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("getMenuPosterAssetStatus 테스트")
    class GetMenuPosterAssetStatusTest {

        @Test
        @DisplayName("성공 - 성공 상태 에셋 조회")
        void getMenuPosterAssetStatus_Success() {
            // Given
            String eaterEmail = "eater@test.com";
            Long assetId = 1L;
            testMenuPosterAsset = MenuPosterAsset.builder()
                    .menuPoster(testMenuPoster)
                    .type(AssetType.IMAGE)
                    .path("asset-url")
                    .status(Status.SUCCESS)
                    .build();

            when(eaterRepository.findByEmailAndDeletedFalse(eaterEmail))
                    .thenReturn(Optional.of(testEater));
            when(menuPosterAssetRepository.findById(assetId))
                    .thenReturn(Optional.of(testMenuPosterAsset));
            doNothing().when(menuValidator).validatePosterOwnership(testEater, testMenuPosterAsset);

            // When
            AssetResultResponse response = menuPosterService.getMenuPosterAssetStatus(assetId, eaterEmail);

            // Then
            assertThat(response.type()).isEqualTo(AssetType.IMAGE);
            assertThat(response.path()).isEqualTo("asset-url");
            verify(eaterRepository).findByEmailAndDeletedFalse(eaterEmail);
            verify(menuPosterAssetRepository).findById(assetId);
            verify(menuValidator).validatePosterOwnership(testEater, testMenuPosterAsset);
        }

        @Test
        @DisplayName("성공 - 대기 상태 에셋 조회")
        void getMenuPosterAssetStatus_Pending() {
            // Given
            String eaterEmail = "eater@test.com";
            Long assetId = 1L;
            testMenuPosterAsset = MenuPosterAsset.builder()
                    .menuPoster(testMenuPoster)
                    .type(AssetType.IMAGE)
                    .status(Status.PENDING)
                    .build();

            when(eaterRepository.findByEmailAndDeletedFalse(eaterEmail))
                    .thenReturn(Optional.of(testEater));
            when(menuPosterAssetRepository.findById(assetId))
                    .thenReturn(Optional.of(testMenuPosterAsset));
            doNothing().when(menuValidator).validatePosterOwnership(testEater, testMenuPosterAsset);

            // When
            AssetResultResponse response = menuPosterService.getMenuPosterAssetStatus(assetId, eaterEmail);

            // Then
            assertThat(response.type()).isEqualTo(AssetType.IMAGE);
            assertThat(response.path()).isEmpty();
        }

        @Test
        @DisplayName("실패 - 실패 상태 에셋 조회")
        void getMenuPosterAssetStatus_Failed() {
            // Given
            String eaterEmail = "eater@test.com";
            Long assetId = 1L;
            testMenuPosterAsset = MenuPosterAsset.builder()
                    .menuPoster(testMenuPoster)
                    .type(AssetType.IMAGE)
                    .status(Status.FAIL)
                    .build();

            when(eaterRepository.findByEmailAndDeletedFalse(eaterEmail))
                    .thenReturn(Optional.of(testEater));
            when(menuPosterAssetRepository.findById(assetId))
                    .thenReturn(Optional.of(testMenuPosterAsset));
            doNothing().when(menuValidator).validatePosterOwnership(testEater, testMenuPosterAsset);

            // When & Then
            assertThatThrownBy(() -> menuPosterService.getMenuPosterAssetStatus(assetId, eaterEmail))
                    .isInstanceOf(ApiException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ASSET_URL_REQUIRED);
        }
    }

    @Nested
    @DisplayName("finalizeMenuPoster 테스트")
    class FinalizeMenuPosterTest {

//        @Test
//        @DisplayName("성공 - 메뉴 포스터 최종 등록")
//        void finalizeMenuPoster_Success() {
//            // Given
//            Long assetId = 1L;
//            Long posterId = 1L;
//            MenuPosterFinalizeRequest request = new MenuPosterFinalizeRequest(
//                    posterId,
//                    assetId,
//                    "최종 설명입니다. 이 설명은 30자 이상이어야 합니다.",
//                    AssetType.IMAGE
//            );
//
//            when(menuPosterAssetRepository.findById(assetId))
//                    .thenReturn(Optional.of(testMenuPosterAsset));
//            when(menuPosterRepository.findById(posterId))
//                    .thenReturn(Optional.of(testMenuPoster));
//            doNothing().when(menuValidator).validateForFinalization(testMenuPosterAsset);
//            doNothing().when(menuValidator).validatePendingStatus(testMenuPoster);
//            doNothing().when(testMenuPoster).updateDescription("최종 설명");
//            doNothing().when(testMenuPoster).updateStatus(Status.SUCCESS);
//            doNothing().when(testMenuPosterAsset).registerMenuPoster(testMenuPoster);
//
//            // When
//            MenuPosterFinalizeResponse response = menuPosterService.finalizeMenuPoster(request);
//
//            // Then
//            assertThat(response).isNotNull();
//            verify(menuPosterAssetRepository).findById(assetId);
//            verify(menuPosterRepository).findById(posterId);
//            verify(menuValidator).validateForFinalization(testMenuPosterAsset);
//            verify(menuValidator).validatePendingStatus(testMenuPoster);
//        }

//        @Test
//        @DisplayName("실패 - 존재하지 않는 에셋")
//        void finalizeMenuPoster_AssetNotFound() {
//            // Given
//            Long nonExistentAssetId = 999L;
//            MenuPosterFinalizeRequest request = new MenuPosterFinalizeRequest(
//                    1L,
//                    nonExistentAssetId,
//                    "테스트 설명입니다. 이 설명은 30자 이상이어야 합니다.",
//                    AssetType.IMAGE
//            );
//
//            when(menuPosterAssetRepository.findById(nonExistentAssetId))
//                    .thenReturn(Optional.empty());
//
//            // When & Then
//            assertThatThrownBy(() -> menuPosterService.finalizeMenuPoster(request))
//                    .isInstanceOf(ApiException.class)
//                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ASSET_NOT_FOUND);
//        }
//    }

//    @Nested
//    @DisplayName("sendMenuPosterToMaker 테스트")
//    class SendMenuPosterToMakerTest {
//
//        @Test
//        @DisplayName("성공 - 메뉴 포스터를 메이커에게 전송")
//        void sendMenuPosterToMaker_Success() {
//            // Given
//            String eaterEmail = "eater@test.com";
//            Long posterId = 1L;
//
//            when(eaterRepository.findByEmailAndDeletedFalse(eaterEmail))
//                    .thenReturn(Optional.of(testEater));
//            when(menuPosterRepository.findById(posterId))
//                    .thenReturn(Optional.of(testMenuPoster));
//            doNothing().when(menuValidator).validatePosterOwnership(testEater, testMenuPoster);
//            doNothing().when(menuValidator).validateNotSent(testMenuPoster);
//            doNothing().when(menuValidator).validateSuccessStatus(testMenuPoster);
//            doNothing().when(testMenuPoster).markAsSent();
//
//            // When
//            menuPosterService.sendMenuPosterToMaker(posterId, eaterEmail);
//
//            // Then
//            verify(eaterRepository).findByEmailAndDeletedFalse(eaterEmail);
//            verify(menuPosterRepository).findById(posterId);
//            verify(menuValidator).validatePosterOwnership(testEater, testMenuPoster);
//            verify(menuValidator).validateNotSent(testMenuPoster);
//            verify(menuValidator).validateSuccessStatus(testMenuPoster);
//        }

        @Test
        @DisplayName("실패 - 존재하지 않는 포스터")
        void sendMenuPosterToMaker_PosterNotFound() {
            // Given
            String eaterEmail = "eater@test.com";
            Long nonExistentPosterId = 999L;

            when(eaterRepository.findByEmailAndDeletedFalse(eaterEmail))
                    .thenReturn(Optional.of(testEater));
            when(menuPosterRepository.findById(nonExistentPosterId))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> menuPosterService.sendMenuPosterToMaker(nonExistentPosterId, eaterEmail))
                    .isInstanceOf(ApiException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.MENU_POSTER_NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("adoptMenuPosters 테스트")
    class AdoptMenuPostersTest {

        @Test
        @DisplayName("성공 - 메뉴 포스터 채택")
        void adoptMenuPosters_Success() {
            // Given
            String makerEmail = "maker@test.com";
            Long storeId = 1L;
            List<Long> posterIds = List.of(1L, 2L);
            AdoptMenuPostersRequest request = new AdoptMenuPostersRequest(storeId, posterIds);

            List<MenuPoster> menuPosters = List.of(testMenuPoster);

            when(makerRepository.findByEmailAndDeletedFalse(makerEmail))
                    .thenReturn(Optional.of(testMaker));
            when(storeRepository.findById(storeId))
                    .thenReturn(Optional.of(testStore));
            when(menuPosterRepository.findAllById(posterIds))
                    .thenReturn(menuPosters);
            when(adoptedMenuPosterRepository.findByStoreIdAndDeletedFalse(storeId))
                    .thenReturn(List.of());
            when(adoptedMenuPosterRepository.saveAll(anyList()))
                    .thenReturn(List.of());

            doNothing().when(menuValidator).validateStoreOwnership(testMaker, testStore);
            doNothing().when(menuValidator).validateMenuPosterCount(posterIds);
            doNothing().when(menuValidator).validateMenuPostersExist(menuPosters, posterIds);
            doNothing().when(menuValidator).validateAllPostersSent(menuPosters);
            doNothing().when(menuValidator).validatePostersBelongToStore(menuPosters, storeId);

            // When
            AdoptMenuPostersResponse response = menuPosterService.adoptMenuPosters(request, makerEmail);

            // Then
            assertThat(response.storeId()).isEqualTo(storeId);
            assertThat(response.adoptedMenuPosterIds()).isEqualTo(posterIds);
            verify(makerRepository).findByEmailAndDeletedFalse(makerEmail);
            verify(storeRepository).findById(storeId);
            verify(menuValidator).validateStoreOwnership(testMaker, testStore);
            verify(adoptedMenuPosterRepository).saveAll(anyList());
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 메이커")
        void adoptMenuPosters_MakerNotFound() {
            // Given
            String nonExistentMakerEmail = "nonexistent@test.com";
            AdoptMenuPostersRequest request = new AdoptMenuPostersRequest(1L, List.of(1L));

            when(makerRepository.findByEmailAndDeletedFalse(nonExistentMakerEmail))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> menuPosterService.adoptMenuPosters(request, nonExistentMakerEmail))
                    .isInstanceOf(ApiException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);
        }
    }
}
