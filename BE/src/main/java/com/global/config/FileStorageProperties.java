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

        Path abs  = Paths.get(absolutePath).toAbsolutePath().normalize();
        Path base = Paths.get(java.util.Objects.requireNonNull(baseDir, "filestorage.base-dir is null"))
                .toAbsolutePath().normalize();        // ex) ~/eatda/test
        Path anchor = base.getParent();                        // ex) ~/<-- 여기 기준으로 상대화 → eatda/test/...

        String urlPath;
        if (anchor != null) {
            try {
                // ex) eatda/test/data/images/...
                Path rel = anchor.relativize(abs);
                urlPath = "/" + rel.toString().replace("\\", "/");
            } catch (IllegalArgumentException e) {
                // 드라이브 다름(Windows) 등으로 relativize 불가한 경우 안전한 폴백
                String anchorStr = anchor.toString();
                String absStr = abs.toString();
                if (absStr.startsWith(anchorStr)) {
                    urlPath = absStr.substring(anchorStr.length()).replace("\\", "/");
                    if (!urlPath.startsWith("/")) urlPath = "/" + urlPath;
                } else {
                    // 최후 폴백: base 기준으로 상대화하고, base의 마지막 디렉토리명을 앞에 붙인다 (test 유지)
                    Path rel = base.relativize(abs); // ex) data/images/...
                    urlPath = "/" + base.getFileName().toString() + "/" + rel.toString().replace("\\", "/"); // ex) /test/data/...
                    // 필요하면 /eatda 접두를 반드시 포함시키고 싶다면:
                    // urlPath = "/eatda/" + base.getFileName().toString() + "/" + rel.toString().replace("\\","/");
                }
            }
        } else {
            // base가 루트(부모 없음)인 특이 케이스
            Path rel = base.relativize(abs);
            urlPath = "/" + rel.toString().replace("\\", "/");
        }

        return trimTrailingSlash(publicBaseUrl) + urlPath;     // ex) https://host/eatda/test/...
    }


    private String trimTrailingSlash(String s) {
        return (s != null && s.endsWith("/")) ? s.substring(0, s.length() - 1) : s;
    }
}
