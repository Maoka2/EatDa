package com.global.redis.cleaner;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.global.redis.constants.RedisStreamKey;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.RecordId;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StreamOperations;

@ExtendWith(MockitoExtension.class)
class RedisStreamCleanerServiceTest {

    private static final String EXPIRE_AT = "expireAt";

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private RedisStreamCleanerService cleanerService;

    @Mock
    private StreamOperations<String, Object, Object> streamOperations;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForStream()).thenReturn(streamOperations);
    }

    @Test
    void TTL이_만료된_모든_스트림의_메시지는_삭제된다() {
        LocalDateTime expiredTime = LocalDateTime.now().minusMinutes(10);
        RecordId recordId = RecordId.of("expired-1");

        for (RedisStreamKey key : RedisStreamKey.values()) {
            mockStreamRecords(key.value(), List.of(new MessageMock(recordId, expiredTime)));
        }

        cleanerService.cleanExpiredMessagesFromAllStreams();

        for (RedisStreamKey key : RedisStreamKey.values()) {
            verify(streamOperations).delete(eq(key.value()), eq(recordId));
        }
    }

    @Test
    void TTL이_지난_메시지만_삭제된다() {
        String key = RedisStreamKey.OCR_MENU.value();
        LocalDateTime now = LocalDateTime.now();
        MessageMock expired = new MessageMock(RecordId.of("expired-1"), now.minusMinutes(5));
        MessageMock valid = new MessageMock(RecordId.of("not-expired-1"), now.plusMinutes(5));

        mockStreamRecords(key, List.of(expired, valid));

        cleanerService.cleanExpiredMessagesFromAllStreams();

        verify(streamOperations).delete(eq(key), eq(expired.recordId));
        verify(streamOperations, never()).delete(eq(key), eq(valid.recordId));
    }

    @Test
    void TTL이_만료되지_않은_메시지는_삭제되지_않는다() {
        String key = RedisStreamKey.EVENT_ASSET.value();
        LocalDateTime now = LocalDateTime.now();

        mockStreamRecords(key, List.of(
                new MessageMock(RecordId.of("not-expired-1"), now.plusMinutes(5)),
                new MessageMock(RecordId.of("not-expired-2"), now.plusMinutes(10))
        ));

        cleanerService.cleanExpiredMessagesFromAllStreams();

        verify(streamOperations, never()).delete(eq(key), (String) any());
    }

    @Test
    void 빈_레디스_스트림에_대해서는_메시지_삭제가_실행되지_않는다() {
        String key = RedisStreamKey.MENU_POSTER.value();
        when(streamOperations.range(eq(key), any(), any())).thenReturn(List.of());

        cleanerService.cleanExpiredMessagesFromAllStreams();

        verify(streamOperations).range(eq(key), any(), any());
        verify(streamOperations, never()).delete(eq(key), (String) any());
    }

    @Test
    void Redis_스트림에_있는_모든_만료_메시지가_삭제되어야_한다() {
        LocalDateTime now = LocalDateTime.now();

        for (RedisStreamKey key : RedisStreamKey.values()) {
            mockStreamRecords(key.value(), List.of(
                    new MessageMock(RecordId.of("expired-1"), now.minusMinutes(10)),
                    new MessageMock(RecordId.of("not-expired-1"), now.plusMinutes(10))
            ));
        }

        cleanerService.cleanExpiredMessagesFromAllStreams();

        for (RedisStreamKey key : RedisStreamKey.values()) {
            verify(streamOperations).delete(eq(key.value()), eq(RecordId.of("expired-1")));
        }
    }

    @Test
    void 스트림_정리_중_발생한_오류는_다른_스트림_정리에_영향을_주지_않는다() {
        String faultyKey = RedisStreamKey.OCR_MENU.value();
        when(streamOperations.range(eq(faultyKey), any(), any()))
                .thenThrow(new RuntimeException("fail"));

        cleanerService.cleanExpiredMessagesFromAllStreams();

        verify(streamOperations).range(eq(faultyKey), any(), any());
    }

    @Test
    void 잘못된_메시지_형식은_삭제되지_않는다() {
        String key = RedisStreamKey.OCR_MENU.value();
        RecordId recordId = RecordId.of("bad-1");

        // expireAt에 잘못된 문자열을 갖는 메시지를 넣어 테스트
        Map<String, Object> body = Map.of(EXPIRE_AT, "invalid");
        mockRawStreamRecord(key, recordId, body);

        when(objectMapper.convertValue("invalid", LocalDateTime.class))
                .thenThrow(new IllegalArgumentException());

        cleanerService.cleanExpiredMessagesFromAllStreams();

        verify(streamOperations, never()).delete(eq(key), (String) any());
    }

    @Test
    void expireAt_필드가_없으면_메시지는_삭제되지_않는다() {
        String key = RedisStreamKey.OCR_MENU.value();
        RecordId recordId = RecordId.of("no-expire-field");

        // expireAt 필드 없이 메시지 생성
        Map<String, Object> body = Map.of("otherField", "value");
        mockRawStreamRecord(key, recordId, body);

        cleanerService.cleanExpiredMessagesFromAllStreams();

        verify(streamOperations, never()).delete(eq(key), (String) any());
    }

    /**
     * 주어진 key에 대한 Redis Stream 메시지를 목(mock) 처리하는 헬퍼 메서드. 메시지 리스트를 기반으로 MapRecord 객체들을 생성하고, 해당 레코드를 Redis Stream에서
     * 조회되도록 설정한다.
     *
     * @param key      Redis Stream 키
     * @param messages 테스트용 메시지 데이터 (recordId와 expireAt 시간 포함)
     */
    private void mockStreamRecords(String key, List<MessageMock> messages) {
        // 각 메시지에 대해 MapRecord를 생성하고, expireAt 값을 미리 파싱되도록 설정
        List<MapRecord<String, Object, Object>> records = messages.stream()
                .map(msg -> {
                    // 메시지 바디 구성: expireAt 필드를 포함
                    Map<String, Object> body = Map.of(EXPIRE_AT, msg.time.toString());

                    // MapRecord는 제네릭 타입이 다르면 생성 시 컴파일 에러가 발생하므로 형변환 수행
                    @SuppressWarnings("unchecked")
                    MapRecord<String, Object, Object> record = (MapRecord<String, Object, Object>)
                            (MapRecord<?, ?, ?>) MapRecord.create(key, body).withId(msg.recordId);

                    // ObjectMapper가 expireAt 값을 LocalDateTime으로 파싱할 수 있도록 설정 (mock 동작 지정)
                    when(objectMapper.convertValue(msg.time.toString(), LocalDateTime.class))
                            .thenReturn(msg.time);

                    return record;
                })
                .collect(Collectors.toList());

        // Redis Stream range 호출 시 위에서 만든 레코드 리스트가 반환되도록 설정
        when(streamOperations.range(eq(key), any(), any())).thenReturn(records);
    }

    /**
     * 만료 시간 필드가 잘못된 형식인 경우를 위한 mock 구성 메서드
     */
    private void mockRawStreamRecord(String key, RecordId id, Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        MapRecord<String, Object, Object> record = (MapRecord<String, Object, Object>)
                (MapRecord<?, ?, ?>) MapRecord.create(key, body).withId(id);

        when(streamOperations.range(eq(key), any(), any()))
                .thenReturn(List.of(record));
    }

    /**
     * 테스트용 메시지 정보를 담는 레코드 클래스. Redis 메시지의 ID와 expireAt 시간을 포함한다.
     */
    private record MessageMock(RecordId recordId, LocalDateTime time) {
    }
}
