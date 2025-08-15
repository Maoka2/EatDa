package com.global.filestorage;

import com.global.config.FileStorageProperties;
import java.nio.file.Path;
import java.nio.file.Paths;
import lombok.RequiredArgsConstructor;
import org.mapstruct.Named;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class FileUrlResolver {
    private final FileStorageProperties properties;

    @Named("toPublicUrl")
    public String toPublicUrl(String fullPath) {
        if (fullPath == null || fullPath.isBlank()) {
            return fullPath;
        }

        // 이미 http(s) URL이면 그대로 반환
        if (fullPath.startsWith("http://") || fullPath.startsWith("https://")) {
            return fullPath;
        }

        Path full = Paths.get(fullPath).toAbsolutePath().normalize();
        Path base = properties.getBaseDirPath();           // 예: /root/eatda
        Path hostBase = properties.getHostBaseDirPath();   // 예: /home/ubuntu/eatda/test

        String rel = null;
        if (full.startsWith(base)) {
            rel = base.relativize(full).toString();
        } else if (hostBase != null && full.startsWith(hostBase)) {
            rel = hostBase.relativize(full).toString();
        } else {
            // 모르는 루트면 변환하지 않음(필요시 로깅)
            return fullPath;
        }

        // 슬래시 통일
        rel = rel.replace('\\', '/');

        String baseUrl = properties.getBaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            return fullPath;
        }

        return baseUrl.endsWith("/") ? baseUrl + rel : baseUrl + "/" + rel;
    }
}
