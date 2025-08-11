package com.global.config;

import java.nio.file.Path;
import java.nio.file.Paths;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "filestorage")
@Getter
@Setter
public class FileStorageProperties {

    private static final String DATA_PATH = "data";
    private static final String IMAGES_PATH = "images";
    private static final String VIDEOS_PATH = "videos";

    private String baseDir;
    private String publicBaseUrl;

    public String getImageRoot() {
        return Paths.get(baseDir, DATA_PATH, IMAGES_PATH)
                .toAbsolutePath().normalize().toString();
    }

    public String getVideoRoot() {
        return Paths.get(baseDir, DATA_PATH, VIDEOS_PATH)
                .toAbsolutePath().normalize().toString();
    }

    public String toResponsePath(final String absolutePath) {
        if (publicBaseUrl == null || publicBaseUrl.isBlank()) {
            return absolutePath; // local: 절대경로 그대로
        }

        final Path abs  = Paths.get(absolutePath).toAbsolutePath().normalize();
        final Path base = Paths.get(java.util.Objects.requireNonNull(baseDir, "filestorage.base-dir is null"))
                .toAbsolutePath().normalize();
        final Path home = Paths.get(System.getProperty("user.home")).toAbsolutePath().normalize();

        // 1) prefix: home -> baseDir (예: "eatda/test")
        String prefixStr;
        try {
            prefixStr = home.relativize(base).toString().replace("\\", "/");
        } catch (IllegalArgumentException e) {
            // 드라이브 다름 등: base에서 마지막 1~2단계만 사용 (eatda/test 보존)
            Path last = base.getFileName();                   // "test"
            Path parent = base.getParent() != null ? base.getParent().getFileName() : null; // "eatda"
            prefixStr = (parent != null ? parent.toString() + "/" : "") +
                    (last != null ? last.toString() : "");
            prefixStr = prefixStr.replace("\\", "/");
        }

        // 2) tail: baseDir -> abs (예: "data/images/...")  ※ abs가 base 하위임을 전제
        String tailStr;
        try {
            tailStr = base.relativize(abs).toString().replace("\\", "/");
        } catch (IllegalArgumentException e) {
            // 폴백: 문자열로 안전 처리
            String absStr = abs.toString();
            String baseStr = base.toString();
            if (absStr.startsWith(baseStr)) {
                tailStr = absStr.substring(baseStr.length()).replace("\\", "/");
                if (tailStr.startsWith("/")) tailStr = tailStr.substring(1);
            } else {
                // 최후 폴백: 파일명만
                tailStr = abs.getFileName().toString();
            }
        }

        String urlPath = "/" + prefixStr + "/" + tailStr;
        return trimTrailingSlash(publicBaseUrl) + urlPath;
    }

    private String trimTrailingSlash(String s) {
        return (s != null && s.endsWith("/")) ? s.substring(0, s.length() - 1) : s;
    }
}
