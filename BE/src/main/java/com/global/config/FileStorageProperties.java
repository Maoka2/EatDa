package com.global.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.List;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

@Configuration
@ConfigurationProperties(prefix = "filestorage")
@Getter
@Setter
@Validated
public class FileStorageProperties {

    private static final String DATA_PATH = "data";
    private static final String IMAGES_PATH = "images";
    private static final String VIDEOS_PATH = "videos";

    /**
     * /home/ubuntu/eatda
     */
    private String baseDir;

    /**
     * CDN 또는 정적 서빙 base-url (없으면 빈 문자열)
     */
    private String baseUrl = "";

    /**
     * 서버의 베이스 디렉토리 (/home/ubuntu/eatda/{})
     */
    private String hostBaseDir;

    /**
     * 영상 관련 설정
     */
    @Valid
    private Video video = new Video();

    // ------- 편의 메서드 -------

    public String getImageRoot() {
        return Paths.get(baseDir, DATA_PATH, IMAGES_PATH).toAbsolutePath().normalize().toString();
    }

    public String getVideoRoot() {
        return Paths.get(baseDir, DATA_PATH, VIDEOS_PATH).toAbsolutePath().normalize().toString();
    }

    public Path getBaseDirPath() {
        return Paths.get(baseDir).toAbsolutePath().normalize();
    }

    public Path getHostBaseDirPath() {
        return Paths.get(hostBaseDir).toAbsolutePath().normalize();
    }

    // ------- nested properties -------

    @Getter
    @Setter
    public static class Video {
        /**
         * 최대 파일 크기(MB)
         */
        @Min(1)
        private long maxSizeMb = 32;

        /**
         * 요청 타임아웃(초)
         */
        @Min(1)
        private int requestTimeoutSec = 20;

        /**
         * 허용 MIME 목록
         */
        @NotEmpty
        private List<String> allowedMime = List.of("video/mp4", "video/quicktime", "video/webm");

        // 편의 변환자
        public long getMaxSizeBytes() {
            return maxSizeMb * 1024L * 1024L;
        }

        public Duration getRequestTimeout() {
            return Duration.ofSeconds(requestTimeoutSec);
        }

        public Set<String> getAllowedMimeSet() {
            return Set.copyOf(allowedMime);
        }
    }
}
