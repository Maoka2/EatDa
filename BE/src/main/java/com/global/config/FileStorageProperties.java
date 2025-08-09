package com.global.config;

import java.nio.file.Path;
import java.nio.file.Paths;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration
@ConfigurationProperties(prefix = "filestorage")
@Getter
@Setter
public class FileStorageProperties {

    private static final String DATA_PATH = "data";
    private static final String IMAGES_PATH = "images";
    private static final String VIDEOS_PATH = "videos";
    private static final String DEFAULT_PROFILE = "default";
    private static final String ACTIVE_PROFILE_KEY = "spring.profiles.active";

    private String baseDir;
    private String env;

    @Autowired
    private Environment springEnv;

    public String getImageRoot() {
        return resolveRoot(IMAGES_PATH);
    }

    public String getVideoRoot() {
        return resolveRoot(VIDEOS_PATH);
    }

    private String resolveRoot(String leaf) {
        Path base = Paths.get(baseDir);
        String effectiveEnv = getEffectiveEnv();

        // baseDir 끝이 이미 env라면 중복으로 붙이지 않음
        if (effectiveEnv != null && !effectiveEnv.isBlank() && !base.endsWith(effectiveEnv)) {
            base = base.resolve(effectiveEnv);
        }

        return base.resolve(DATA_PATH)
                .resolve(leaf)
                .toAbsolutePath()
                .normalize()
                .toString();
    }

    private String getEffectiveEnv() {
        if (env != null && !env.isBlank()) {
            return env;
        }

        return springEnv.getProperty(ACTIVE_PROFILE_KEY, DEFAULT_PROFILE);
    }
}
