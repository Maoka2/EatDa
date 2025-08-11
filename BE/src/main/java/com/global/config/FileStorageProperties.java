package com.global.config;

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

    public String getImageRoot() {
        return Paths.get(baseDir, DATA_PATH, IMAGES_PATH)
                .toAbsolutePath()
                .normalize()
                .toString();
    }

    public String getVideoRoot() {
        return Paths.get(baseDir, DATA_PATH, VIDEOS_PATH)
                .toAbsolutePath()
                .normalize()
                .toString();
    }
}
