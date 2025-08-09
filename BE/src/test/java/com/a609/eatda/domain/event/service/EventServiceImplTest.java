package com.a609.eatda.domain.event.service;

import com.domain.event.dto.redis.EventAssetGenerateMessage;
import com.domain.event.dto.request.EventAssetCreateRequest;
import com.domain.event.dto.response.EventAssetRequestResponse;
import com.domain.event.entity.Event;
import com.domain.event.entity.EventAsset;
import com.domain.event.infrastructure.redis.EventAssetRedisPublisher;
import com.domain.event.mapper.EventAssetRepository;
import com.domain.event.mapper.EventMapper;
import com.domain.event.repository.EventRepository;
import com.domain.event.service.impl.EventServiceImpl;
import com.domain.store.entity.Store;
import com.domain.store.repository.StoreRepository;
import com.global.constants.AssetType;
import com.global.constants.ErrorCode;
import com.global.constants.Status;
import com.global.exception.ApiException;
import com.global.filestorage.FileStorageService;
import com.global.redis.constants.RedisStreamKey;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @InjectMocks
    private EventServiceImpl eventService;

    @Mock
    private StoreRepository storeRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private EventAssetRepository eventAssetRepository;
    @Mock
    private EventMapper eventMapper;
    @Mock
    private FileStorageService fileStorageService;
    @Mock
    private EventAssetRedisPublisher eventAssetRedisPublisher;

    private Store store;
    private Event event;
    private EventAsset eventAsset;
    private final Long userId = 1L;
    private final Long storeId = 100L;
    private final Long assetId = 300L;

    @BeforeEach
    void setUp() {
        // Store 엔티티
        store = Store.builder()
                .name("테스트 가게")
                .address("서울시 강남구")
                .latitude(37.5)
                .longitude(127.0)
                .build();
        setFieldValue(store, storeId);

        // Event 엔티티
        event = Event.builder()
                .store(store)
                .startDate(LocalDate.parse("2024-12-20"))
                .endDate(LocalDate.parse("2024-12-25"))
                .status(Status.PENDING)
                .build();
        Long eventId = 200L;
        setFieldValue(event, eventId);

        // EventAsset 엔티티 - ID를 설정한 상태로 생성
        eventAsset = EventAsset.builder()
                .event(event)
                .type(AssetType.IMAGE)
                .prompt("크리스마스 특별 할인 이벤트")
                .status(Status.PENDING)
                .build();
        setFieldValue(eventAsset, assetId);
    }

    // Request 생성 헬퍼 메서드
    private EventAssetCreateRequest createRequest(String title,
                                                  String prompt, List<MultipartFile> files) {
        return new EventAssetCreateRequest(
                storeId,
                title,
                AssetType.IMAGE,
                "2024-12-20",
                "2024-12-25",
                prompt,
                files
        );
    }

    @Test
    @DisplayName("이벤트 에셋 요청 성공")
    void requestEventAsset_Success() {
        // given
        MultipartFile mockFile = mock(MultipartFile.class);
        given(mockFile.getSize()).willReturn(5L * 1024 * 1024); // 5MB
        given(mockFile.getOriginalFilename()).willReturn("test.jpg");

        EventAssetCreateRequest request = createRequest(
                "크리스마스 이벤트",
                "크리스마스 특별 할인 이벤트",
                List.of(mockFile)
        );

        given(storeRepository.findById(storeId)).willReturn(Optional.of(store));
        given(eventMapper.toPendingEvent(store, LocalDate.parse("2024-12-20"), LocalDate.parse("2024-12-25")))
                .willReturn(event);
        given(eventRepository.save(event)).willReturn(event);
        given(eventMapper.toPendingEventAsset(event, AssetType.IMAGE, request)).willReturn(eventAsset);
        given(eventAssetRepository.save(any(EventAsset.class))).willReturn(eventAsset);
        given(fileStorageService.storeImage(any(MultipartFile.class), eq("events"), anyString()))
                .willReturn("uploaded/path/image.jpg");
        given(eventMapper.toRequestResponse(eventAsset))
                .willReturn(new EventAssetRequestResponse(assetId));

        // when
        EventAssetRequestResponse response = eventService.requestEventAsset(request, userId);

        // then
        assertThat(response).isNotNull();
        assertThat(response.eventAssetId()).isEqualTo(assetId);

        // verify interactions
        verify(storeRepository).findById(storeId);
        verify(eventRepository).save(event);
        verify(eventAssetRepository).save(eventAsset);
        verify(fileStorageService).storeImage(mockFile, "events", "test.jpg");

        // Redis 메시지 발행 검증
        ArgumentCaptor<EventAssetGenerateMessage> messageCaptor =
                ArgumentCaptor.forClass(EventAssetGenerateMessage.class);
        verify(eventAssetRedisPublisher).publish(eq(RedisStreamKey.EVENT_ASSET), messageCaptor.capture());

        EventAssetGenerateMessage capturedMessage = messageCaptor.getValue();
        assertThat(capturedMessage.getAssetId()).isEqualTo(assetId);
        assertThat(capturedMessage.getStoreId()).isEqualTo(storeId);
        assertThat(capturedMessage.getUserId()).isEqualTo(userId);
        assertThat(capturedMessage.getTitle()).isEqualTo("크리스마스 이벤트");
        assertThat(capturedMessage.getReferenceImages()).hasSize(1);
    }

    @Test
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
        assertThatThrownBy(() -> eventService.requestEventAsset(request, userId))
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

        given(storeRepository.findById(storeId)).willReturn(Optional.of(store));

        // when & then
        assertThatThrownBy(() -> eventService.requestEventAsset(request, userId))
                .isInstanceOf(ApiException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.IMAGE_TOO_LARGE);

        verify(storeRepository).findById(storeId);
        verifyNoInteractions(eventRepository, eventAssetRepository, fileStorageService);
    }

    @Test
    @DisplayName("여러 이미지 업로드 성공")
    void requestEventAsset_MultipleImages() {
        // given
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

        given(storeRepository.findById(storeId)).willReturn(Optional.of(store));
        given(eventMapper.toPendingEvent(any(), any(), any())).willReturn(event);
        given(eventRepository.save(any())).willReturn(event);
        given(eventMapper.toPendingEventAsset(any(), any(), any())).willReturn(eventAsset);
        given(eventAssetRepository.save(any())).willReturn(eventAsset);
        given(fileStorageService.storeImage(file1, "events", "image1.jpg"))
                .willReturn("uploaded/image1.jpg");
        given(fileStorageService.storeImage(file2, "events", "image2.jpg"))
                .willReturn("uploaded/image2.jpg");
        given(eventMapper.toRequestResponse(any()))
                .willReturn(new EventAssetRequestResponse(assetId));

        // when
        EventAssetRequestResponse response = eventService.requestEventAsset(request, userId);

        // then
        assertThat(response.eventAssetId()).isEqualTo(assetId);

        ArgumentCaptor<EventAssetGenerateMessage> messageCaptor =
                ArgumentCaptor.forClass(EventAssetGenerateMessage.class);
        verify(eventAssetRedisPublisher).publish(eq(RedisStreamKey.EVENT_ASSET), messageCaptor.capture());

        assertThat(messageCaptor.getValue().getReferenceImages())
                .hasSize(2)
                .containsExactly("uploaded/image1.jpg", "uploaded/image2.jpg");
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