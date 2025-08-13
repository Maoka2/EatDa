package com.global.redis.cleaner;

import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.stereotype.Component;

// @formatter:off
/**
 * Redis Stream의 만료된 메시지들을 정리하는 배치 Tasklet
 * Spring Batch Job의 Step으로 실행되며, 각 Redis Stream의 만료된 메시지를 주기적으로 삭제합니다.
 */
// @formatter:on
@Component
@RequiredArgsConstructor
public class RedisStreamCleanerTasklet implements Tasklet {

    private final RedisStreamCleanerService cleanerService;

    /**
     * 배치 작업을 실행하는 메서드, 모든 Redis Stream을 순회하며 만료된 메시지를 정리합니다.
     *
     * @param contribution Step 실행 상태 및 결과를 저장하는 컨테이너
     * @param chunkContext Step 실행 컨텍스트 정보
     * @return RepeatStatus.FINISHED - 작업 완료 상태 반환
     */
    @Override
    public RepeatStatus execute(@NonNull final StepContribution contribution,
                                @NonNull final ChunkContext chunkContext) {

        cleanerService.cleanExpiredMessagesFromAllStreams();
        return RepeatStatus.FINISHED;
    }
}
