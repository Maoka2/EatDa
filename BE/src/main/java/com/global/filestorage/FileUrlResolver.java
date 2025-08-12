package com.global.filestorage;

import com.global.config.FileStorageProperties;
import java.nio.file.Path;
import java.nio.file.Paths;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FileUrlResolver {
    private final FileStorageProperties properties;

    public String toPublicUrl(String fullPath) {
        Path full = Paths.get(fullPath).toAbsolutePath().normalize();
        Path base = properties.getBaseDirPath();

        Path relative = base.relativize(full);
        String rel = relative.toString().replace("\\", "/");

        String baseUrl = properties.getBaseUrl();

        if (baseUrl == null || baseUrl.isBlank()) {
            return fullPath;
        }
        return baseUrl.endsWith("/") ? baseUrl + rel : baseUrl + "/" + rel;
    }
}
