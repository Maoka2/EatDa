package com.domain.review.publisher;

import com.domain.review.dto.redis.ReviewAssetGenerateMessage;
import com.global.redis.constants.RedisStreamKey;
import com.global.redis.publisher.RedisStreamWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReviewAssetRedisPublisher {
    private static final String REDIS_PUBLISH_ERROR = "리뷰 에셋 Redis 메시지 발행 실패: {}";

    private final RedisStreamWriter<ReviewAssetGenerateMessage> redisStreamWriter;
    private final RedisStreamKey streamKey = RedisStreamKey.REVIEW_ASSET;

    public void publish(ReviewAssetGenerateMessage message) {
        try {
            redisStreamWriter.publish(streamKey, message);
        } catch (Exception e) {
            log.error(REDIS_PUBLISH_ERROR, message.reviewAssetId(), e);
        }
    }
}


