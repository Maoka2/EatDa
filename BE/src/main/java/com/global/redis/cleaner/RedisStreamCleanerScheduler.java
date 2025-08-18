package com.global.redis.cleaner;

import static com.global.redis.constants.RedisConstants.REDIS_STREAM_CLEANER_EXECUTION_ERROR;
import static com.global.redis.constants.RedisConstants.REDIS_STREAM_CLEANER_JOB_PARAM_TIMESTAMP;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Redis Stream 정리 Job을 주기적으로 실행하는 스케줄러
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RedisStreamCleanerScheduler {

    private final JobLauncher jobLauncher;
    private final Job redisStreamCleanerJob;

    /**
     * 5분 간격으로 Redis Stream 정리 Job 실행
     */
    @Scheduled(cron = "0 0/20 * * * *") // 매 5분마다 실행
    public void runRedisStreamCleaner() {
        try {
            jobLauncher.run(
                    redisStreamCleanerJob,
                    new JobParametersBuilder()
                            .addLong(REDIS_STREAM_CLEANER_JOB_PARAM_TIMESTAMP,
                                    Instant.now().toEpochMilli()) // 매 실행마다 고유 파라미터 필요
                            .toJobParameters()
            );
        } catch (Exception e) {
            log.error(REDIS_STREAM_CLEANER_EXECUTION_ERROR, e);
        }
    }
}
