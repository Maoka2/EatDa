package com.a609.eatda.domain.event.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.anyList;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import com.domain.event.dto.redis.EventAssetGenerateMessage;
import com.domain.event.dto.request.EventAssetCreateRequest;
import com.domain.event.dto.request.EventFinalizeRequest;
import com.domain.event.dto.response.ActiveStoreEventResponse;
import com.domain.event.dto.response.EventAssetRequestResponse;
import com.domain.event.dto.response.EventFinalizeResponse;
import com.domain.event.dto.response.MyEventResponse;
import com.domain.event.entity.Event;
import com.domain.event.entity.EventAsset;
import com.domain.event.infrastructure.redis.EventAssetRedisPublisher;
import com.domain.event.repository.EventAssetRepository;
import com.domain.event.repository.EventRepository;
import com.domain.event.service.impl.EventServiceImpl;
import com.domain.store.entity.Store;
import com.domain.store.repository.StoreRepository;
import com.domain.user.constants.Role;
import com.domain.user.entity.User;
import com.domain.user.repository.MakerRepository;
import com.global.constants.AssetType;
import com.global.constants.ErrorCode;
import com.global.constants.PagingConstants;
import com.global.constants.Status;
import com.global.dto.request.AssetCallbackRequest;
import com.global.dto.response.AssetResultResponse;
import com.global.exception.ApiException;
import com.global.filestorage.FileStorageService;
import com.global.redis.constants.RedisStreamKey;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EventServiceImplTest {

    private final String makerEmail = "maker@example.com";
    private final Long userId = 1L;
    private final Long storeId = 100L;
    private final Long assetId = 300L;
    @InjectMocks
    private EventServiceImpl eventService;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private MakerRepository makerRepository;
    @Mock
    private EventAssetRepository eventAssetRepository;
    @Mock
    private FileStorageService fileStorageService;
    @Mock
    private EventAssetRedisPublisher eventAssetRedisPublisher;
    @Mock
    private User maker;
    @Mock
    private Store store;
    @Mock
    private Event event;
    @Mock
    private EventAsset eventAsset;

    @BeforeEach
    void setUp() {
        given(makerRepository.findByEmailAndDeletedFalse(makerEmail))
                .willReturn(Optional.of(maker));

        given(maker.getId()).willReturn(userId);
        given(maker.getEmail()).willReturn(makerEmail);
        given(maker.getRole()).willReturn(Role.MAKER);

        given(store.getId()).willReturn(storeId);
        given(store.getName()).willReturn("테스트 가게");
        given(store.getAddress()).willReturn("서울시 강남구");
        given(store.getLatitude()).willReturn(37.5);
        given(store.getLongitude()).willReturn(127.0);
        given(store.getMaker()).willReturn(maker);

        given(event.getStore()).willReturn(store);
        given(event.getStartDate()).willReturn(LocalDate.parse("2025-12-20"));
        given(event.getEndDate()).willReturn(LocalDate.parse("2025-12-25"));
        given(event.getStatus()).willReturn(Status.PENDING);

        given(eventAsset.getId()).willReturn(assetId);
        given(eventAsset.getType()).willReturn(AssetType.IMAGE);
        given(eventAsset.getPrompt()).willReturn("크리스마스 특별 할인 이벤트");
        given(eventAsset.getStatus()).willReturn(Status.PENDING);
        given(eventAsset.getEvent()).willReturn(event);
    }

    // Request 생성 헬퍼 메서드
    private EventAssetCreateRequest createRequest(String title,
                                                  String prompt, List<MultipartFile> files) {
        return new EventAssetCreateRequest(
                title,
                "IMAGE",
                "2025-12-20",
                "2025-12-25",
                prompt,
                files
        );
    }

    @Test
    @DisplayName("이벤트 에셋 요청 성공")
    void requestEventAsset_Success() {
        // given
        String expectedPath = "events/" + makerEmail;
        MultipartFile mockFile = mock(MultipartFile.class);
        given(mockFile.getSize()).willReturn(5L * 1024 * 1024); // 5MB
        given(mockFile.getOriginalFilename()).willReturn("test.jpg");

        EventAssetCreateRequest request = createRequest(
                "크리스마스 이벤트",
                "크리스마스 특별 할인 이벤트",
                List.of(mockFile)
        );

        // given(storeRepository.findById(storeId)).willReturn(Optional.of(store));
        given(maker.getStores()).willReturn(List.of(store));
        given(eventRepository.save(any(Event.class))).willReturn(event);
        given(eventAssetRepository.save(any(EventAsset.class))).willReturn(eventAsset);
        given(fileStorageService.storeImage(
                mockFile,
                expectedPath,
                "test.jpg",
                false
        )).willReturn("uploaded/path/image.jpg");

        // when
        EventAssetRequestResponse response = eventService.requestEventAsset(request, makerEmail);

        // then
        assertThat(response).isNotNull();
        assertThat(response.eventAssetId()).isEqualTo(assetId);

        // verify interactions
        // verify(storeRepository).findById(storeId);
        verify(eventRepository).save(any(Event.class));
        verify(eventAssetRepository).save(any(EventAsset.class));
        verify(fileStorageService).storeImage(
                mockFile,
                expectedPath,
                "test.jpg",
                false // WebP 변환 적용 검증 X
        );

        // Redis 메시지 발행 검증
        ArgumentCaptor<EventAssetGenerateMessage> messageCaptor =
                ArgumentCaptor.forClass(EventAssetGenerateMessage.class);
        verify(eventAssetRedisPublisher).publish(eq(RedisStreamKey.EVENT_ASSET), messageCaptor.capture());

        EventAssetGenerateMessage capturedMessage = messageCaptor.getValue();
        assertThat(capturedMessage.getEventAssetId()).isEqualTo(assetId);
        assertThat(capturedMessage.getStoreId()).isEqualTo(storeId);
        assertThat(capturedMessage.getUserId()).isEqualTo(userId);
        assertThat(capturedMessage.getTitle()).isEqualTo("크리스마스 이벤트");
        assertThat(capturedMessage.getReferenceImages()).hasSize(1);
    }

    // @Test
    @DisplayName("존재하지 않는 가게 - 예외 발생")
    void requestEventAsset_StoreNotFound() {
        // given
        MultipartFile mockFile = mock(MultipartFile.class);
        EventAssetCreateRequest request = createRequest(
                "크리스마스 이벤트",
                "크리스마스 특별 할인 이벤트",
                List.of(mockFile)
        );

        given(storeRepository.findById(storeId)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> eventService.requestEventAsset(request, makerEmail))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.STORE_NOT_FOUND);

        // verify no further interactions
        verifyNoInteractions(eventRepository, eventAssetRepository, fileStorageService, eventAssetRedisPublisher);
    }

    @Test
    @DisplayName("이미지 크기 초과 - 예외 발생")
    void requestEventAsset_ImageTooLarge() {
        // given
        MultipartFile largeFile = mock(MultipartFile.class);
        given(largeFile.getSize()).willReturn(11L * 1024 * 1024); // 11MB
        given(largeFile.getOriginalFilename()).willReturn("large.jpg");

        EventAssetCreateRequest request = createRequest(
                "이벤트",
                "프롬프트",
                List.of(largeFile)
        );

        //given(storeRepository.findById(storeId)).willReturn(Optional.of(store));
        given(maker.getStores()).willReturn(List.of(store));

        // when & then
        assertThatThrownBy(() -> eventService.requestEventAsset(request, makerEmail))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.IMAGE_TOO_LARGE);

        // verify(storeRepository).findById(storeId);
        verifyNoInteractions(eventRepository, eventAssetRepository, fileStorageService);
    }

    @Test
    @DisplayName("여러 이미지 업로드 성공")
    void requestEventAsset_MultipleImages() {
        // given
        String expectedPath = "events/" + makerEmail;
        MultipartFile file1 = mock(MultipartFile.class);
        MultipartFile file2 = mock(MultipartFile.class);
        given(file1.getSize()).willReturn(3L * 1024 * 1024);
        given(file2.getSize()).willReturn(4L * 1024 * 1024);
        given(file1.getOriginalFilename()).willReturn("image1.jpg");
        given(file2.getOriginalFilename()).willReturn("image2.jpg");

        EventAssetCreateRequest request = createRequest(
                "이벤트",
                "프롬프트",
                List.of(file1, file2)
        );

        // given(storeRepository.findById(storeId)).willReturn(Optional.of(store));
        given(maker.getStores()).willReturn(List.of(store));
        given(eventRepository.save(any(Event.class))).willReturn(event);
        given(eventAssetRepository.save(any(EventAsset.class))).willReturn(eventAsset);
        given(fileStorageService.storeImage(
                file1,
                expectedPath,
                "image1.jpg",
                false // WebP 변환 적용 X
        )).willReturn("uploaded/path/image1.jpg");

        given(fileStorageService.storeImage(
                file2,
                expectedPath,
                "image2.jpg",
                false  // WebP 변환 적용 X
        )).willReturn("uploaded/path/image2.jpg");

        // when
        EventAssetRequestResponse response = eventService.requestEventAsset(request, makerEmail);

        // then
        assertThat(response.eventAssetId()).isEqualTo(assetId);

        ArgumentCaptor<EventAssetGenerateMessage> messageCaptor =
                ArgumentCaptor.forClass(EventAssetGenerateMessage.class);
        verify(eventAssetRedisPublisher).publish(eq(RedisStreamKey.EVENT_ASSET), messageCaptor.capture());
        verify(fileStorageService).storeImage(file1, expectedPath, "image1.jpg", false);
        verify(fileStorageService).storeImage(file2, expectedPath, "image2.jpg", false);
        assertThat(messageCaptor.getValue().getReferenceImages())
                .hasSize(2)
                .containsExactly("uploaded/path/image1.jpg", "uploaded/path/image2.jpg");
    }

    @Test
    @DisplayName("이벤트 에셋 콜백 처리 - 성공 케이스")
    void handleEventAssetCallback_Success() {
        // given
        AssetCallbackRequest<AssetType> request = new AssetCallbackRequest<>(
                assetId,
                "SUCCESS",
                "https://cdn.example.com/generated-asset.jpg",
                AssetType.IMAGE
        );

        given(eventAssetRepository.findById(assetId)).willReturn(Optional.of(eventAsset));

        // when
        eventService.handleEventAssetCallback(request);

        // then
        verify(eventAssetRepository).findById(assetId);
        verify(eventAsset).processCallback(Status.SUCCESS, "https://cdn.example.com/generated-asset.jpg");
    }

    @Test
    @DisplayName("이벤트 에셋 콜백 처리 - 실패 케이스")
    void handleEventAssetCallback_Fail() {
        // given
        AssetCallbackRequest<AssetType> request = new AssetCallbackRequest<>(
                assetId,
                "FAIL",
                null,
                null
        );

        given(eventAssetRepository.findById(assetId)).willReturn(Optional.of(eventAsset));

        // when
        eventService.handleEventAssetCallback(request);

        // then
        verify(eventAssetRepository).findById(assetId);
        verify(eventAsset).processCallback(Status.FAIL, null);
    }

    @Test
    @DisplayName("이벤트 에셋 콜백 처리 - 존재하지 않는 에셋")
    void handleEventAssetCallback_AssetNotFound() {
        // given
        AssetCallbackRequest<AssetType> request = new AssetCallbackRequest<>(
                999L,  // 존재하지 않는 ID
                "SUCCESS",
                "https://cdn.example.com/asset.jpg",
                AssetType.IMAGE
        );

        given(eventAssetRepository.findById(999L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> eventService.handleEventAssetCallback(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ASSET_NOT_FOUND);

        verify(eventAssetRepository).findById(999L);
        verifyNoMoreInteractions(eventAssetRepository);
    }

    @Test
    @DisplayName("이벤트 에셋 콜백 처리 - 유효성 검증 실패")
    void handleEventAssetCallback_ValidationFailed() {
        // given
        AssetCallbackRequest<AssetType> request = new AssetCallbackRequest<>(
                assetId,
                "INVALID_STATUS",  // 잘못된 상태값
                "https://cdn.example.com/asset.jpg",
                AssetType.IMAGE
        );

        given(eventAssetRepository.findById(assetId)).willReturn(Optional.of(eventAsset));

        // when & then
        assertThatThrownBy(() -> eventService.handleEventAssetCallback(request))
                .isInstanceOf(ApiException.class);

        verify(eventAssetRepository).findById(assetId);
    }

    @Test
    @DisplayName("이벤트 에셋 상태 조회 - SUCCESS 상태")
    void getEventAssetStatus_Success() {
        // given
        String assetUrl = "https://cdn.example.com/asset.jpg";
        given(eventAsset.getStatus()).willReturn(Status.SUCCESS);
        given(eventAsset.getPath()).willReturn(assetUrl);
        given(eventAssetRepository.findByIdWithStore(assetId))
                .willReturn(Optional.of(eventAsset));

        // when
        AssetResultResponse response = eventService.getEventAssetStatus(assetId, makerEmail);

        // then
        assertThat(response).isNotNull();
        assertThat(response.type()).isEqualTo(AssetType.IMAGE);
        assertThat(response.path()).isEqualTo(assetUrl);

        verify(eventAssetRepository).findByIdWithStore(assetId);
    }

    @Test
    @DisplayName("이벤트 에셋 상태 조회 - PENDING 상태")
    void getEventAssetStatus_Pending() {
        // given
        given(eventAssetRepository.findByIdWithStore(assetId))
                .willReturn(Optional.of(eventAsset));

        // when
        AssetResultResponse response = eventService.getEventAssetStatus(assetId, makerEmail);

        // then
        assertThat(response).isNotNull();
        assertThat(response.type()).isEqualTo(AssetType.IMAGE);
        assertThat(response.path()).isEqualTo("");  // PENDING 상태는 빈 문자열

        verify(eventAssetRepository).findByIdWithStore(assetId);
    }

    @Test
    @DisplayName("이벤트 에셋 상태 조회 - FAIL 상태")
    void getEventAssetStatus_Fail() {
        // given
        given(eventAsset.getStatus()).willReturn(Status.FAIL);
        given(eventAssetRepository.findByIdWithStore(assetId))
                .willReturn(Optional.of(eventAsset));

        // when & then
        assertThatThrownBy(() -> eventService.getEventAssetStatus(assetId, makerEmail))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ASSET_URL_REQUIRED);

        verify(eventAssetRepository).findByIdWithStore(assetId);
    }

    @Test
    @DisplayName("이벤트 에셋 상태 조회 - 에셋을 찾을 수 없음")
    void getEventAssetStatus_AssetNotFound() {
        // given
        given(eventAssetRepository.findByIdWithStore(assetId))
                .willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> eventService.getEventAssetStatus(assetId, makerEmail))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ASSET_NOT_FOUND);

        verify(eventAssetRepository).findByIdWithStore(assetId);
    }

    @Test
    @DisplayName("이벤트 에셋 상태 조회 - 권한 없음 (다른 사용자)")
    void getEventAssetStatus_Forbidden() {
        // given
        String otherEmail = "other@example.com";
        User requestUser = User.builder()
                .email(otherEmail)
                .build();

        given(makerRepository.findByEmailAndDeletedFalse(otherEmail))
                .willReturn(Optional.of(requestUser));
        given(eventAssetRepository.findByIdWithStore(assetId))
                .willReturn(Optional.of(eventAsset));

        // when & then
        assertThatThrownBy(() -> eventService.downloadEventAsset(assetId, otherEmail))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);

        verify(eventAssetRepository).findByIdWithStore(assetId);
    }

    @Test
    @DisplayName("이벤트 확정 - 성공")
    void finalizeEvent_Success() {
        // given
        Long eventId = 200L;
        EventFinalizeRequest request = new EventFinalizeRequest(
                eventId,
                assetId,
                "크리스마스 특별 할인 이벤트 - 최대 50% 할인",
                AssetType.IMAGE
        );

        EventAsset mockAsset = mock(EventAsset.class);
        Event mockEvent = mock(Event.class);

        given(eventAssetRepository.findById(assetId)).willReturn(Optional.of(mockAsset));
        given(mockAsset.getStatus()).willReturn(Status.SUCCESS);
        given(mockAsset.getType()).willReturn(AssetType.IMAGE);
        given(mockAsset.getId()).willReturn(assetId);

        given(eventRepository.findById(eventId)).willReturn(Optional.of(mockEvent));
        given(mockEvent.getStatus()).willReturn(Status.PENDING);
        given(mockEvent.getId()).willReturn(eventId);

        // when
        EventFinalizeResponse response = eventService.finalizeEvent(request);

        // then
        assertThat(response).isNotNull();

        verify(eventAssetRepository).findById(assetId);
        verify(eventRepository).findById(eventId);
        verify(mockEvent).updateDescription("크리스마스 특별 할인 이벤트 - 최대 50% 할인");
        verify(mockEvent).updateStatus(Status.SUCCESS);
        verify(mockAsset).registerEvent(mockEvent);
    }

    @Test
    @DisplayName("이벤트 확정 - 에셋을 찾을 수 없음")
    void finalizeEvent_AssetNotFound() {
        // given
        Long eventId = 200L;
        EventFinalizeRequest request = new EventFinalizeRequest(
                eventId,
                999L, // 존재하지 않는 ID
                "설명",
                AssetType.IMAGE
        );

        given(eventAssetRepository.findById(999L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> eventService.finalizeEvent(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ASSET_NOT_FOUND);

        verify(eventAssetRepository).findById(999L);
        verifyNoInteractions(eventRepository);
    }

    @Test
    @DisplayName("이벤트 확정 - 에셋이 성공 상태가 아님")
    void finalizeEvent_AssetNotSuccess() {
        // given
        Long eventId = 200L;
        EventFinalizeRequest request = new EventFinalizeRequest(
                eventId,
                assetId,
                "설명",
                AssetType.IMAGE
        );

        EventAsset mockAsset = mock(EventAsset.class);
        given(eventAssetRepository.findById(assetId)).willReturn(Optional.of(mockAsset));
        given(mockAsset.getStatus()).willReturn(Status.PENDING);  // SUCCESS가 아님
        given(mockAsset.getType()).willReturn(AssetType.IMAGE);
        given(mockAsset.getId()).willReturn(assetId);

        // when & then
        assertThatThrownBy(() -> eventService.finalizeEvent(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ASSET_NOT_SUCCESS);

        verify(eventAssetRepository).findById(assetId);
        verify(mockAsset).getStatus();
        verifyNoInteractions(eventRepository);
    }

    @Test
    @DisplayName("이벤트 확정 - 에셋 타입 불일치")
    void finalizeEvent_AssetTypeMismatch() {
        // given
        Long eventId = 200L;
        EventFinalizeRequest request = new EventFinalizeRequest(
                eventId,
                assetId,
                "설명",
                AssetType.SHORTS_GEN_4  // IMAGE가 아닌 다른 타입
        );

        EventAsset mockAsset = mock(EventAsset.class);
        given(eventAssetRepository.findById(assetId)).willReturn(Optional.of(mockAsset));
        given(mockAsset.getStatus()).willReturn(Status.SUCCESS);
        given(mockAsset.getType()).willReturn(AssetType.SHORTS_GEN_4);

        // when & then
        assertThatThrownBy(() -> eventService.finalizeEvent(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ASSET_TYPE_MISMATCH);

        verify(eventAssetRepository).findById(assetId);
        verifyNoInteractions(eventRepository);
    }

    @Test
    @DisplayName("이벤트 확정 - 이벤트를 찾을 수 없음")
    void finalizeEvent_EventNotFound() {
        // given
        Long eventId = 999L;
        EventFinalizeRequest request = new EventFinalizeRequest(
                eventId,
                assetId,
                "설명",
                AssetType.IMAGE
        );

        EventAsset mockAsset = mock(EventAsset.class);
        given(eventAssetRepository.findById(assetId)).willReturn(Optional.of(mockAsset));
        given(mockAsset.getStatus()).willReturn(Status.SUCCESS);
        given(mockAsset.getType()).willReturn(AssetType.IMAGE);

        given(eventRepository.findById(eventId)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> eventService.finalizeEvent(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.EVENT_NOT_FOUND);

        verify(eventAssetRepository).findById(assetId);
        verify(eventRepository).findById(eventId);
    }

    @Test
    @DisplayName("이벤트 확정 - 이벤트가 PENDING 상태가 아님")
    void finalizeEvent_EventNotPending() {
        // given
        Long eventId = 200L;
        EventFinalizeRequest request = new EventFinalizeRequest(
                eventId,
                assetId,
                "설명",
                AssetType.IMAGE
        );

        EventAsset mockAsset = mock(EventAsset.class);
        Event mockEvent = mock(Event.class);

        given(eventAssetRepository.findById(assetId)).willReturn(Optional.of(mockAsset));
        given(mockAsset.getStatus()).willReturn(Status.SUCCESS);
        given(mockAsset.getType()).willReturn(AssetType.IMAGE);

        given(eventRepository.findById(eventId)).willReturn(Optional.of(mockEvent));
        given(mockEvent.getStatus()).willReturn(Status.SUCCESS);  // PENDING이 아님
        given(mockEvent.getId()).willReturn(eventId);

        // when & then
        assertThatThrownBy(() -> eventService.finalizeEvent(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.EVENT_NOT_PENDING);

        verify(eventAssetRepository).findById(assetId);
        verify(eventRepository).findById(eventId);
        verify(mockEvent).getStatus();
        verify(mockEvent, never()).updateDescription(anyString());
        verify(mockEvent, never()).updateStatus(any());
    }

    @Test
    @DisplayName("이벤트 확정 - FAIL 상태의 에셋")
    void finalizeEvent_AssetStatusFail() {
        // given
        Long eventId = 200L;
        EventFinalizeRequest request = new EventFinalizeRequest(
                eventId,
                assetId,
                "설명",
                AssetType.IMAGE
        );

        EventAsset mockAsset = mock(EventAsset.class);
        given(eventAssetRepository.findById(assetId)).willReturn(Optional.of(mockAsset));
        given(mockAsset.getStatus()).willReturn(Status.FAIL);
        given(mockAsset.getId()).willReturn(assetId);

        // when & then
        assertThatThrownBy(() -> eventService.finalizeEvent(request))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ASSET_NOT_SUCCESS);

        verify(eventAssetRepository).findById(assetId);
        verify(mockAsset).getStatus();
        verifyNoInteractions(eventRepository);
    }

    @Test
    @DisplayName("이벤트 에셋 다운로드 - 성공")
    void downloadEventAsset_Success() {
        // given
        Resource mockResource = mock(Resource.class);

        given(eventAsset.getPath()).willReturn("/uploads/events/asset123.webp");
        given(makerRepository.findByEmailAndDeletedFalse(makerEmail))
                .willReturn(Optional.of(maker));
        given(eventAssetRepository.findByIdWithStore(assetId))
                .willReturn(Optional.of(eventAsset));
        given(fileStorageService.loadAsResource("/uploads/events/asset123.webp"))
                .willReturn(mockResource);
        given(mockResource.exists()).willReturn(true);
        given(mockResource.isReadable()).willReturn(true);

        // when
        Resource result = eventService.downloadEventAsset(assetId, makerEmail);

        // then
        assertThat(result).isNotNull();
        assertThat(result).isEqualTo(mockResource);

        verify(makerRepository).findByEmailAndDeletedFalse(makerEmail);
        verify(eventAssetRepository).findByIdWithStore(assetId);
        verify(fileStorageService).loadAsResource("/uploads/events/asset123.webp");
        verify(mockResource).exists();
        verify(mockResource).isReadable();
    }

    @Test
    @DisplayName("이벤트 에셋 다운로드 - 사용자를 찾을 수 없음")
    void downloadEventAsset_UserNotFound() {
        // given
        String makerEmail = "notfound@example.com";

        given(makerRepository.findByEmailAndDeletedFalse(makerEmail))
                .willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> eventService.downloadEventAsset(assetId, makerEmail))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.UNAUTHORIZED);

        verify(makerRepository).findByEmailAndDeletedFalse(makerEmail);
        verifyNoInteractions(eventAssetRepository, fileStorageService);
    }

    @Test
    @DisplayName("이벤트 에셋 다운로드 - 에셋을 찾을 수 없음")
    void downloadEventAsset_AssetNotFound() {
        // given
        given(makerRepository.findByEmailAndDeletedFalse(makerEmail))
                .willReturn(Optional.of(maker));
        given(eventAssetRepository.findByIdWithStore(assetId))
                .willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> eventService.downloadEventAsset(assetId, makerEmail))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ASSET_NOT_FOUND);

        verify(makerRepository).findByEmailAndDeletedFalse(makerEmail);
        verify(eventAssetRepository).findByIdWithStore(assetId);
        verifyNoInteractions(fileStorageService);
    }

    @Test
    @DisplayName("이벤트 에셋 다운로드 - 권한 없음 (다른 사용자)")
    void downloadEventAsset_Forbidden() {
        // given
        String otherEmail = "other@example.com";
        User requestUser = User.builder()
                .email(otherEmail)
                .build();

        given(makerRepository.findByEmailAndDeletedFalse(otherEmail))
                .willReturn(Optional.of(requestUser));
        given(eventAssetRepository.findByIdWithStore(assetId))
                .willReturn(Optional.of(eventAsset));

        // when & then
        assertThatThrownBy(() -> eventService.downloadEventAsset(assetId, otherEmail))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);

        verify(makerRepository).findByEmailAndDeletedFalse(otherEmail);
        verify(eventAssetRepository).findByIdWithStore(assetId);
        verifyNoInteractions(fileStorageService);
    }

    @Test
    @DisplayName("이벤트 에셋 다운로드 - URL이 없음")
    void downloadEventAsset_AssetUrlEmpty() {
        // given
        given(eventAsset.getPath()).willReturn("");
        given(makerRepository.findByEmailAndDeletedFalse(makerEmail))
                .willReturn(Optional.of(maker));
        given(eventAssetRepository.findByIdWithStore(assetId))
                .willReturn(Optional.of(eventAsset));

        // when & then
        assertThatThrownBy(() -> eventService.downloadEventAsset(assetId, makerEmail))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ASSET_URL_REQUIRED);

        verify(makerRepository).findByEmailAndDeletedFalse(makerEmail);
        verify(eventAssetRepository).findByIdWithStore(assetId);
        verifyNoInteractions(fileStorageService);
    }

    @Test
    @DisplayName("이벤트 에셋 다운로드 - URL이 null")
    void downloadEventAsset_AssetUrlNull() {
        // given
        given(eventAsset.getPath()).willReturn(null);
        given(makerRepository.findByEmailAndDeletedFalse(makerEmail))
                .willReturn(Optional.of(maker));
        given(eventAssetRepository.findByIdWithStore(assetId))
                .willReturn(Optional.of(eventAsset));

        // when & then
        assertThatThrownBy(() -> eventService.downloadEventAsset(assetId, makerEmail))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ASSET_URL_REQUIRED);

        verify(makerRepository).findByEmailAndDeletedFalse(makerEmail);
        verify(eventAssetRepository).findByIdWithStore(assetId);
        verifyNoInteractions(fileStorageService);
    }

    @Test
    @DisplayName("이벤트 에셋 다운로드 - 파일이 존재하지 않음")
    void downloadEventAsset_FileNotExists() {
        // given
        Resource mockResource = mock(Resource.class);

        given(eventAsset.getPath()).willReturn("/uploads/events/notfound.webp");
        given(makerRepository.findByEmailAndDeletedFalse(makerEmail))
                .willReturn(Optional.of(maker));
        given(eventAssetRepository.findByIdWithStore(assetId))
                .willReturn(Optional.of(eventAsset));
        given(fileStorageService.loadAsResource("/uploads/events/notfound.webp"))
                .willReturn(mockResource);
        given(mockResource.exists()).willReturn(false);  // 파일이 존재하지 않음

        // when & then
        assertThatThrownBy(() -> eventService.downloadEventAsset(assetId, makerEmail))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FILE_NOT_FOUND);

        verify(makerRepository).findByEmailAndDeletedFalse(makerEmail);
        verify(eventAssetRepository).findByIdWithStore(assetId);
        verify(fileStorageService).loadAsResource("/uploads/events/notfound.webp");
        verify(mockResource).exists();
    }

    @Test
    @DisplayName("이벤트 에셋 다운로드 - 파일을 읽을 수 없음")
    void downloadEventAsset_FileNotReadable() {
        // given
        String makerEmail = "maker@example.com";
        User maker = User.builder().build();
        setFieldValue(maker, userId);

        Store store = Store.builder()
                .name("테스트 가게")
                .maker(maker)
                .build();

        Event event = Event.builder()
                .store(store)
                .build();

        EventAsset asset = EventAsset.builder()
                .event(event)
                .path("/uploads/events/unreadable.webp")
                .build();

        Resource mockResource = mock(Resource.class);

        given(makerRepository.findByEmailAndDeletedFalse(makerEmail))
                .willReturn(Optional.of(maker));
        given(eventAssetRepository.findByIdWithStore(assetId))
                .willReturn(Optional.of(asset));
        given(fileStorageService.loadAsResource("/uploads/events/unreadable.webp"))
                .willReturn(mockResource);
        given(mockResource.exists()).willReturn(true);
        given(mockResource.isReadable()).willReturn(false);  // 읽을 수 없음

        // when & then
        assertThatThrownBy(() -> eventService.downloadEventAsset(assetId, makerEmail))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FILE_NOT_FOUND);

        verify(makerRepository).findByEmailAndDeletedFalse(makerEmail);
        verify(eventAssetRepository).findByIdWithStore(assetId);
        verify(fileStorageService).loadAsResource("/uploads/events/unreadable.webp");
        verify(mockResource).exists();
        verify(mockResource).isReadable();
    }

    @Test
    @DisplayName("이벤트 에셋 다운로드 - 파일 로드 중 예외 발생")
    void downloadEventAsset_LoadResourceException() {
        // given
        Store store = Store.builder()
                .name("테스트 가게")
                .maker(maker)
                .build();

        Event event = Event.builder()
                .store(store)
                .build();

        EventAsset asset = EventAsset.builder()
                .event(event)
                .path("/uploads/events/error.webp")
                .build();

        given(makerRepository.findByEmailAndDeletedFalse(makerEmail))
                .willReturn(Optional.of(maker));
        given(eventAssetRepository.findByIdWithStore(assetId))
                .willReturn(Optional.of(asset));
        given(fileStorageService.loadAsResource("/uploads/events/error.webp"))
                .willThrow(new RuntimeException("파일 시스템 오류"));

        // when & then
        assertThatThrownBy(() -> eventService.downloadEventAsset(assetId, makerEmail))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FILE_DOWNLOAD_ERROR);

        verify(makerRepository).findByEmailAndDeletedFalse(makerEmail);
        verify(eventAssetRepository).findByIdWithStore(assetId);
        verify(fileStorageService).loadAsResource("/uploads/events/error.webp");
    }

    @Test
    @DisplayName("내 이벤트 목록 조회 - 성공 (첫 페이지)")
    void getMyEvents_Success_FirstPage() {
        // given
        Store store1 = Store.builder()
                .name("테스트 가게1")
                .maker(maker)
                .build();

        Store store2 = Store.builder()
                .name("테스트 가게2")
                .maker(maker)
                .build();

        Event event1 = Event.builder()
                .store(store1)
                .startDate(LocalDate.parse("2024-12-01"))
                .endDate(LocalDate.parse("2024-12-31"))
                .status(Status.SUCCESS)
                .build();
        setFieldValue(event1, 100L);
        event1.setTitle("연말 특별 이벤트");

        Event event2 = Event.builder()
                .store(store2)
                .startDate(LocalDate.parse("2024-12-15"))
                .endDate(LocalDate.parse("2024-12-25"))
                .status(Status.SUCCESS)
                .build();
        setFieldValue(event2, 99L);
        event2.updateDescription("크리스마스 이벤트");

        EventAsset asset1 = EventAsset.builder()
                .event(event1)
                .type(AssetType.IMAGE)
                .path("/uploads/event1.webp")
                .status(Status.SUCCESS)
                .build();

        EventAsset asset2 = EventAsset.builder()
                .event(event2)
                .type(AssetType.IMAGE)
                .path("/uploads/event2.webp")
                .status(Status.SUCCESS)
                .build();

        List<Event> events = List.of(event1, event2);
        List<EventAsset> assets = List.of(asset1, asset2);

        given(makerRepository.findByEmailAndDeletedFalse(makerEmail))
                .willReturn(Optional.of(maker));
        given(eventRepository.findMyEventsWithCursor(eq(makerEmail), isNull(), any(PageRequest.class)))
                .willReturn(events);
        given(eventAssetRepository.findByEventIds(List.of(100L, 99L)))
                .willReturn(assets);

        // when
        List<MyEventResponse> responses = eventService.getMyEvents(null, makerEmail);

        // then
        assertThat(responses).hasSize(2);

        MyEventResponse response1 = responses.getFirst();
        assertThat(response1.eventId()).isEqualTo(100L);
        assertThat(response1.storeName()).isEqualTo("테스트 가게1");
        assertThat(response1.title()).isEqualTo("연말 특별 이벤트");
        assertThat(response1.postUrl()).isEqualTo("/uploads/event1.webp");

        MyEventResponse response2 = responses.get(1);
        assertThat(response2.eventId()).isEqualTo(99L);
        assertThat(response2.storeName()).isEqualTo("테스트 가게2");
        assertThat(response2.postUrl()).isEqualTo("/uploads/event2.webp");

        verify(makerRepository).findByEmailAndDeletedFalse(makerEmail);
        verify(eventRepository).findMyEventsWithCursor(eq(makerEmail), isNull(), any(PageRequest.class));
        verify(eventAssetRepository).findByEventIds(List.of(100L, 99L));
    }

    @Test
    @DisplayName("내 이벤트 목록 조회 - 커서 기반 페이징")
    void getMyEvents_Success_WithCursor() {
        // given
        Long lastEventId = 50L;

        Store store = Store.builder()
                .name("테스트 가게")
                .maker(maker)
                .build();

        Event event = Event.builder()
                .store(store)
                .startDate(LocalDate.parse("2024-12-01"))
                .endDate(LocalDate.parse("2024-12-31"))
                .status(Status.SUCCESS)
                .build();
        setFieldValue(event, 45L);

        EventAsset asset = EventAsset.builder()
                .event(event)
                .type(AssetType.IMAGE)
                .path("/uploads/event45.webp")
                .status(Status.SUCCESS)
                .build();

        given(makerRepository.findByEmailAndDeletedFalse(makerEmail))
                .willReturn(Optional.of(maker));
        given(eventRepository.findMyEventsWithCursor(eq(makerEmail), eq(lastEventId), any(PageRequest.class)))
                .willReturn(List.of(event));
        given(eventAssetRepository.findByEventIds(List.of(45L)))
                .willReturn(List.of(asset));

        // when
        List<MyEventResponse> responses = eventService.getMyEvents(lastEventId, makerEmail);

        // then
        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().eventId()).isEqualTo(45L);

        verify(eventRepository).findMyEventsWithCursor(eq(makerEmail), eq(lastEventId), any(PageRequest.class));
    }

    @Test
    @DisplayName("내 이벤트 목록 조회 - 이벤트는 있지만 에셋이 없는 경우")
    void getMyEvents_Success_NoAssets() {
        // given
        Store store = Store.builder()
                .name("테스트 가게")
                .maker(maker)
                .build();

        Event event = Event.builder()
                .store(store)
                .startDate(LocalDate.parse("2024-12-01"))
                .endDate(LocalDate.parse("2024-12-31"))
                .status(Status.PENDING)
                .build();
        setFieldValue(event, 100L);

        given(makerRepository.findByEmailAndDeletedFalse(makerEmail))
                .willReturn(Optional.of(maker));
        given(eventRepository.findMyEventsWithCursor(eq(makerEmail), isNull(), any(PageRequest.class)))
                .willReturn(List.of(event));
        given(eventAssetRepository.findByEventIds(List.of(100L)))
                .willReturn(Collections.emptyList());  // 에셋 없음

        // when
        List<MyEventResponse> responses = eventService.getMyEvents(null, makerEmail);

        // then
        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().eventId()).isEqualTo(100L);
        assertThat(responses.getFirst().postUrl()).isNull();  // 에셋이 없으므로 null

        verify(eventAssetRepository).findByEventIds(List.of(100L));
    }

    @Test
    @DisplayName("내 이벤트 목록 조회 - 빈 결과")
    void getMyEvents_EmptyResult() {
        // given
        String makerEmail = "maker@example.com";
        User maker = User.builder().build();

        given(makerRepository.findByEmailAndDeletedFalse(makerEmail))
                .willReturn(Optional.of(maker));
        given(eventRepository.findMyEventsWithCursor(eq(makerEmail), isNull(), any(PageRequest.class)))
                .willReturn(Collections.emptyList());

        // when
        List<MyEventResponse> responses = eventService.getMyEvents(null, makerEmail);

        // then
        assertThat(responses).isEmpty();

        verify(eventRepository).findMyEventsWithCursor(eq(makerEmail), isNull(), any(PageRequest.class));
        verify(eventAssetRepository).findByEventIds(anyList());  // 이벤트가 없으므로 호출 안됨
    }

    @Test
    @DisplayName("내 이벤트 목록 조회 - 사용자를 찾을 수 없음")
    void getMyEvents_UserNotFound() {
        // given
        String makerEmail = "notfound@example.com";

        given(makerRepository.findByEmailAndDeletedFalse(makerEmail))
                .willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> eventService.getMyEvents(null, makerEmail))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.UNAUTHORIZED);

        verify(makerRepository).findByEmailAndDeletedFalse(makerEmail);
        verifyNoInteractions(eventRepository, eventAssetRepository);
    }

    @Test
    @DisplayName("내 이벤트 목록 조회 - 여러 이벤트 중 일부만 에셋 있음")
    void getMyEvents_PartialAssets() {
        // given
        Store store = Store.builder()
                .name("테스트 가게")
                .maker(maker)
                .build();

        Event event1 = Event.builder()
                .store(store)
                .startDate(LocalDate.parse("2024-12-01"))
                .endDate(LocalDate.parse("2024-12-31"))
                .status(Status.SUCCESS)
                .build();
        setFieldValue(event1, 100L);

        Event event2 = Event.builder()
                .store(store)
                .startDate(LocalDate.parse("2024-12-15"))
                .endDate(LocalDate.parse("2024-12-25"))
                .status(Status.PENDING)
                .build();
        setFieldValue(event2, 99L);

        // event1만 에셋 있음
        EventAsset asset1 = EventAsset.builder()
                .event(event1)
                .type(AssetType.IMAGE)
                .path("/uploads/event1.webp")
                .status(Status.SUCCESS)
                .build();

        given(makerRepository.findByEmailAndDeletedFalse(makerEmail))
                .willReturn(Optional.of(maker));
        given(eventRepository.findMyEventsWithCursor(eq(makerEmail), isNull(), any(PageRequest.class)))
                .willReturn(List.of(event1, event2));
        given(eventAssetRepository.findByEventIds(List.of(100L, 99L)))
                .willReturn(List.of(asset1));  // event1의 에셋만 반환

        // when
        List<MyEventResponse> responses = eventService.getMyEvents(null, makerEmail);

        // then
        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).postUrl()).isEqualTo("/uploads/event1.webp");
        assertThat(responses.get(1).postUrl()).isNull();  // event2는 에셋 없음
    }

    @Test
    @DisplayName("내 이벤트 목록 조회 - 페이지 크기 확인")
    void getMyEvents_PageSizeVerification() {
        // given
        String makerEmail = "maker@example.com";
        User maker = User.builder().build();

        given(makerRepository.findByEmailAndDeletedFalse(makerEmail))
                .willReturn(Optional.of(maker));
        given(eventRepository.findMyEventsWithCursor(any(), any(), any()))
                .willReturn(Collections.emptyList());

        // when
        eventService.getMyEvents(null, makerEmail);

        // then - PageRequest 파라미터 검증
        ArgumentCaptor<PageRequest> pageRequestCaptor = ArgumentCaptor.forClass(PageRequest.class);
        verify(eventRepository).findMyEventsWithCursor(any(), any(), pageRequestCaptor.capture());

        PageRequest capturedPageRequest = pageRequestCaptor.getValue();
        assertThat(capturedPageRequest.getPageNumber()).isEqualTo(0);
        assertThat(capturedPageRequest.getPageSize()).isEqualTo(PagingConstants.DEFAULT_SIZE.value);
    }

    @Test
    @DisplayName("진행 중인 가게 이벤트 조회 - 성공")
    void getActiveStoreEvents_Success() {
        // given
        Long storeId = 100L;
        LocalDate today = LocalDate.now();

        Store store = Store.builder()
                .name("테스트 가게")
                .build();
        setFieldValue(store, storeId);

        Event activeEvent1 = Event.builder()
                .store(store)
                .startDate(today.minusDays(5))
                .endDate(today.plusDays(5))
                .status(Status.SUCCESS)
                .build();
        setFieldValue(activeEvent1, 50L);
        activeEvent1.setTitle("진행중 이벤트 1");

        Event activeEvent2 = Event.builder()
                .store(store)
                .startDate(today.minusDays(2))
                .endDate(today.plusDays(10))
                .status(Status.SUCCESS)
                .build();
        setFieldValue(activeEvent2, 45L);
        activeEvent2.setTitle("진행중 이벤트 2");

        EventAsset asset1 = EventAsset.builder()
                .event(activeEvent1)
                .type(AssetType.IMAGE)
                .path("/uploads/event50.webp")
                .status(Status.SUCCESS)
                .build();

        List<Event> events = List.of(activeEvent1, activeEvent2);

        given(storeRepository.findById(storeId))
                .willReturn(Optional.of(store));
        given(eventRepository.findActiveEvents( any(LocalDate.class), isNull(), any(Pageable.class)))
                .willReturn(events);
        given(eventAssetRepository.findByEventIds(List.of(50L, 45L)))
                .willReturn(List.of(asset1));  // event2는 에셋 없음

        // when
        List<ActiveStoreEventResponse> responses = eventService.getActiveEvents(null);

        // then
        assertThat(responses).hasSize(2);

        ActiveStoreEventResponse response1 = responses.getFirst();
        assertThat(response1.eventId()).isEqualTo(50L);
        assertThat(response1.title()).isNotNull();
        assertThat(response1.postUrl()).isEqualTo("/uploads/event50.webp");
        assertThat(response1.startAt()).isNotNull();
        assertThat(response1.endAt()).isNotNull();

        ActiveStoreEventResponse response2 = responses.get(1);
        assertThat(response2.eventId()).isEqualTo(45L);
        assertThat(response2.postUrl()).isNull();  // 에셋 없음

        verify(eventRepository).findActiveEvents(any(LocalDate.class), isNull(), any(Pageable.class));
        verify(eventAssetRepository).findByEventIds(List.of(50L, 45L));
    }

    @Test
    @DisplayName("진행 중인 가게 이벤트 조회 - 커서 페이징")
    void getActiveStoreEvents_WithCursor() {
        // given
        Long storeId = 100L;
        Long lastEventId = 30L;
        LocalDate today = LocalDate.now();

        Store store = Store.builder()
                .name("테스트 가게")
                .build();

        Event event = Event.builder()
                .store(store)
                .startDate(today.minusDays(1))
                .endDate(today.plusDays(1))
                .status(Status.SUCCESS)
                .build();
        setFieldValue(event, 25L);

        given(storeRepository.findById(storeId))
                .willReturn(Optional.of(store));
        given(eventRepository.findActiveEvents(any(LocalDate.class), eq(lastEventId),
                any(Pageable.class)))
                .willReturn(List.of(event));
        given(eventAssetRepository.findByEventIds(any()))
                .willReturn(Collections.emptyList());

        // when
        List<ActiveStoreEventResponse> responses = eventService.getActiveEvents(lastEventId);

        // then
        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().eventId()).isEqualTo(25L);

        verify(eventRepository).findActiveEvents(any(LocalDate.class), eq(lastEventId),
                any(Pageable.class));
    }

    @Test
    @DisplayName("진행 중인 가게 이벤트 조회 - 종료된 이벤트는 제외")
    void getActiveStoreEvents_ExcludeExpiredEvents() {
        // given
        Long storeId = 100L;
        LocalDate today = LocalDate.now();

        Store store = Store.builder()
                .name("테스트 가게")
                .build();

        // Repository에서 이미 필터링되어 반환되므로, 진행 중인 이벤트만 반환된다고 가정
        Event activeEvent = Event.builder()
                .store(store)
                .startDate(today.minusDays(1))
                .endDate(today.plusDays(1))
                .status(Status.SUCCESS)
                .build();
        setFieldValue(activeEvent, 100L);

        given(storeRepository.findById(storeId))
                .willReturn(Optional.of(store));
        given(eventRepository.findActiveEvents(any(LocalDate.class), isNull(), any(Pageable.class)))
                .willReturn(List.of(activeEvent));  // 진행 중인 이벤트만 반환
        given(eventAssetRepository.findByEventIds(any()))
                .willReturn(Collections.emptyList());

        // when
        List<ActiveStoreEventResponse> responses = eventService.getActiveEvents(null);

        // then
        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().eventId()).isEqualTo(100L);

        // 날짜 범위 검증
        LocalDate startAt = responses.getFirst().startAt();
        LocalDate endAt = responses.getFirst().endAt();
        LocalDate now = LocalDate.now();

        assertThat(startAt).isBefore(now);
        assertThat(endAt).isAfter(now);
    }

    // 테스트용 헬퍼 메서드
    private void setFieldValue(Object target, Object value) {
        try {
            var field = target.getClass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
