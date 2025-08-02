package com.global.redis.config;

import static com.global.redis.constants.RedisConstants.REDIS_STREAM_CLEANER_JOB_NAME;
import static com.global.redis.constants.RedisConstants.REDIS_STREAM_CLEANER_STEP_NAME;

import com.global.redis.cleaner.RedisStreamCleanerTasklet;
import lombok.RequiredArgsConstructor;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * Redis Stream 메시지 정리 작업을 위한 Spring Batch Job 설정
 */
@Configuration
@RequiredArgsConstructor
public class RedisStreamCleanerJobConfig {

    private final JobRepository jobRepository;
    private final PlatformTransactionManager transactionManager;
    private final RedisStreamCleanerTasklet cleanerTasklet;

    @Bean
    public Job redisStreamCleanerJob() {
        return new JobBuilder(REDIS_STREAM_CLEANER_JOB_NAME, jobRepository)
                .start(redisStreamCleanerStep())
                .build();
    }

    @Bean
    public Step redisStreamCleanerStep() {
        return new StepBuilder(REDIS_STREAM_CLEANER_STEP_NAME, jobRepository)
                .tasklet(cleanerTasklet, transactionManager)
                .build();
    }
}
