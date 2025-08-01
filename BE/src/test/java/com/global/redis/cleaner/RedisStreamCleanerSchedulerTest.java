package com.global.redis.cleaner;

import static org.mockito.Mockito.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.verify;

import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.launch.JobLauncher;

@ExtendWith(MockitoExtension.class)
class RedisStreamCleanerSchedulerTest {

    @Mock
    private JobLauncher jobLauncher;

    @Mock
    private Job redisStreamCleanerJob;

    @InjectMocks
    private RedisStreamCleanerScheduler scheduler;

    @Test
    void 배치_정상_호출_시_JobLauncher_호출된다() throws Exception {
        JobParameters params = new JobParametersBuilder()
                .addLong("timestamp", Instant.now().toEpochMilli())
                .toJobParameters();

        scheduler.runRedisStreamCleaner();

        verify(jobLauncher).run(eq(redisStreamCleanerJob), any(JobParameters.class));
    }

    @Test
    void JobLauncher_예외_발생시_예외_로깅한다() throws Exception {
        doThrow(new RuntimeException("launch fail"))
                .when(jobLauncher).run(any(), any());

        scheduler.runRedisStreamCleaner();

        verify(jobLauncher).run(any(), any());
    }
}
